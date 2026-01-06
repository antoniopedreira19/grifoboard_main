-- Criar tabela para respostas do formulário de fornecedores
CREATE TABLE public.formulario_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 1. Informações da Empresa
  nome_empresa TEXT NOT NULL,
  cnpj_cpf TEXT NOT NULL,
  site TEXT,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  tempo_atuacao TEXT NOT NULL,
  
  -- 2. Tipo de Atuação
  tipos_atuacao TEXT[] NOT NULL,
  tipo_atuacao_outro TEXT,
  categorias_atendidas TEXT[] NOT NULL,
  categorias_outro TEXT,
  
  -- 3. Faixa de Preço e Capacidade
  ticket_medio TEXT NOT NULL,
  capacidade_atendimento TEXT NOT NULL,
  
  -- 4. Regiões Atendidas
  regioes_atendidas TEXT[] NOT NULL,
  cidades_frequentes TEXT,
  
  -- 5. Diferenciais
  diferenciais TEXT[] NOT NULL,
  diferenciais_outro TEXT,
  
  -- 6. Documentos (paths no storage)
  logo_path TEXT,
  portfolio_path TEXT,
  certificacoes_path TEXT,
  
  -- 7. Contato Comercial
  nome_responsavel TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.formulario_fornecedores ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (formulário público)
CREATE POLICY "Qualquer um pode inserir formulário de fornecedores"
ON public.formulario_fornecedores
FOR INSERT
TO public
WITH CHECK (true);

-- Política para master_admin visualizar todos os formulários
CREATE POLICY "Master admin pode visualizar formulários de fornecedores"
ON public.formulario_fornecedores
FOR SELECT
TO authenticated
USING (is_master_admin());

-- Criar bucket para uploads de fornecedores
INSERT INTO storage.buckets (id, name, public)
VALUES ('formularios-fornecedores', 'formularios-fornecedores', false)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload público
CREATE POLICY "Qualquer um pode fazer upload de documentos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'formularios-fornecedores');

-- Política para master_admin visualizar arquivos
CREATE POLICY "Master admin pode visualizar arquivos de fornecedores"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'formularios-fornecedores' AND is_master_admin());