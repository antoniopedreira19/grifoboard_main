-- =============================================
-- FASE 1: Criar Views Públicas para Marketplace
-- =============================================

-- View pública para profissionais (oculta CPF, email, telefone, data_nascimento)
CREATE OR REPLACE VIEW public.marketplace_profissionais AS
SELECT 
  id,
  nome_completo,
  cidade,
  estado,
  funcao_principal,
  funcao_principal_outro,
  especialidades,
  especialidades_outro,
  tempo_experiencia,
  obras_relevantes,
  disponibilidade_atual,
  modalidade_trabalho,
  regioes_atendidas,
  cidades_frequentes,
  pretensao_valor,
  equipamentos_proprios,
  diferenciais,
  diferenciais_outro,
  logo_path,
  fotos_trabalhos_path,
  curriculo_path,
  certificacoes_path,
  selo_grifo,
  ja_trabalhou_com_grifo,
  created_at,
  user_id
FROM public.formulario_profissionais;

-- View pública para fornecedores (oculta CNPJ/CPF, email, telefone)
CREATE OR REPLACE VIEW public.marketplace_fornecedores AS
SELECT 
  id,
  nome_empresa,
  site,
  cidade,
  estado,
  tempo_atuacao,
  tipos_atuacao,
  tipo_atuacao_outro,
  categorias_atendidas,
  categorias_outro,
  ticket_medio,
  capacidade_atendimento,
  regioes_atendidas,
  cidades_frequentes,
  diferenciais,
  diferenciais_outro,
  nome_responsavel,
  logo_path,
  portfolio_path,
  certificacoes_path,
  fotos_trabalhos_path,
  selo_grifo,
  ja_trabalhou_com_grifo,
  created_at,
  user_id
FROM public.formulario_fornecedores;

-- View pública para empresas (oculta CNPJ, email, whatsapp)
CREATE OR REPLACE VIEW public.marketplace_empresas AS
SELECT 
  id,
  nome_empresa,
  site,
  cidade,
  estado,
  ano_fundacao,
  tamanho_empresa,
  nome_contato,
  cargo_contato,
  obras_andamento,
  tipos_obras,
  tipos_obras_outro,
  ticket_medio,
  planejamento_curto_prazo,
  ferramentas_gestao,
  principais_desafios,
  desafios_outro,
  logo_path,
  apresentacao_path,
  selo_grifo,
  ja_trabalhou_com_grifo,
  created_at,
  user_id
FROM public.formulario_empresas;

-- =============================================
-- FASE 2: Remover policies públicas das tabelas de formulários
-- =============================================

-- Profissionais
DROP POLICY IF EXISTS "Public Read Profissionais" ON public.formulario_profissionais;
DROP POLICY IF EXISTS "Authenticated users can view profissionais for marketplace" ON public.formulario_profissionais;

-- Fornecedores
DROP POLICY IF EXISTS "Public Read Fornecedores" ON public.formulario_fornecedores;
DROP POLICY IF EXISTS "Authenticated users can view fornecedores for marketplace" ON public.formulario_fornecedores;

-- Empresas
DROP POLICY IF EXISTS "Public Read Empresas" ON public.formulario_empresas;
DROP POLICY IF EXISTS "Authenticated users can view empresas for marketplace" ON public.formulario_empresas;

-- =============================================
-- FASE 3: Restringir acesso à tabela usuarios
-- =============================================

-- Remover policies permissivas
DROP POLICY IF EXISTS "Permitir leitura para autenticados" ON public.usuarios;
DROP POLICY IF EXISTS "pbi_read_select" ON public.usuarios;

-- Criar policy restritiva: usuário vê próprio perfil ou membros da mesma empresa
CREATE POLICY "Users can view own profile or company members"
ON public.usuarios FOR SELECT TO authenticated
USING (
  id = auth.uid() 
  OR (
    empresa_id IS NOT NULL 
    AND empresa_id = current_empresa_id()
  )
);

-- =============================================
-- FASE 4: Corrigir função match_documents
-- =============================================

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.0,
  match_count integer DEFAULT 10,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  and documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;