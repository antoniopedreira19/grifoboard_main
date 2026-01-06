-- Create table for formulario_empresas
CREATE TABLE IF NOT EXISTS public.formulario_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- 1. Informações da Empresa
  nome_empresa text NOT NULL,
  cnpj text NOT NULL,
  site text,
  cidade text NOT NULL,
  estado text NOT NULL,
  ano_fundacao text NOT NULL,
  tamanho_empresa text NOT NULL,
  
  -- 2. Contato Principal
  nome_contato text NOT NULL,
  cargo_contato text NOT NULL,
  whatsapp_contato text NOT NULL,
  email_contato text NOT NULL,
  
  -- 3. Estrutura Operacional
  obras_andamento text NOT NULL,
  tipos_obras text[] NOT NULL,
  tipos_obras_outro text,
  ticket_medio text NOT NULL,
  
  -- 4. Processo Atual de Planejamento
  planejamento_curto_prazo text NOT NULL,
  ferramentas_gestao text,
  
  -- 5. Principais desafios
  principais_desafios text[] NOT NULL,
  desafios_outro text,
  
  -- 6. Documentos (paths)
  logo_path text,
  apresentacao_path text
);

-- Enable RLS
ALTER TABLE public.formulario_empresas ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Qualquer um pode inserir formulário de empresas"
  ON public.formulario_empresas
  FOR INSERT
  WITH CHECK (true);

-- Only master_admin can view
CREATE POLICY "Master admin pode visualizar formulários de empresas"
  ON public.formulario_empresas
  FOR SELECT
  USING (is_master_admin());