-- Criar tabela para índice de fotos do diário
create table if not exists public.diario_fotos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  data date not null,
  path text not null,
  legenda text null,
  criado_por uuid not null,
  criado_em timestamptz not null default now()
);

-- Índices para performance
create index if not exists diario_fotos_obra_data_idx on public.diario_fotos (obra_id, data);
create index if not exists diario_fotos_criado_por_idx on public.diario_fotos (criado_por);

-- Habilitar RLS
alter table public.diario_fotos enable row level security;

-- SELECT: ver fotos apenas das obras às quais o usuário tem acesso (criador ou admin da empresa)
create policy "Users can view photos from their obras or company obras" 
on public.diario_fotos
for select to authenticated
using (
  exists (
    select 1 from public.obras
    where obras.id = diario_fotos.obra_id
      and (obras.created_by = auth.uid() or (obras.empresa_id = current_empresa_id() and is_company_admin()))
  )
);

-- INSERT: apenas se tiver acesso à obra
create policy "Users can insert photos in their obras or company obras"
on public.diario_fotos
for insert to authenticated
with check (
  exists (
    select 1 from public.obras
    where obras.id = diario_fotos.obra_id
      and (obras.created_by = auth.uid() or (obras.empresa_id = current_empresa_id() and is_company_admin()))
  )
);

-- DELETE: apenas criador da foto ou admin da empresa
create policy "Users can delete their own photos or company admin can delete all"
on public.diario_fotos
for delete to authenticated
using (
  criado_por = auth.uid() or
  (exists (
    select 1 from public.obras
    where obras.id = diario_fotos.obra_id
      and obras.empresa_id = current_empresa_id()
      and is_company_admin()
  ))
);

-- Criar bucket privado para fotos do diário
insert into storage.buckets (id, name, public)
values ('diario-obra', 'diario-obra', false)
on conflict (id) do nothing;

-- Policy de upload: usuários autenticados podem fazer upload
create policy "Authenticated users can upload photos"
on storage.objects
for insert to authenticated
with check (bucket_id = 'diario-obra');

-- Policy de leitura: apenas usuários com acesso à obra podem ler
create policy "Users can view photos from their obras"
on storage.objects
for select to authenticated
using (
  bucket_id = 'diario-obra' and
  exists (
    select 1 from public.diario_fotos df
    join public.obras o on df.obra_id = o.id
    where df.path = storage.objects.name
      and (o.created_by = auth.uid() or (o.empresa_id = current_empresa_id() and is_company_admin()))
  )
);

-- Policy de delete: apenas criador ou admin pode deletar arquivos
create policy "Users can delete their own photos or admins can delete"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'diario-obra' and
  exists (
    select 1 from public.diario_fotos df
    join public.obras o on df.obra_id = o.id
    where df.path = storage.objects.name
      and (df.criado_por = auth.uid() or (o.empresa_id = current_empresa_id() and is_company_admin()))
  )
);