-- Criar tabela para formulário de profissionais
CREATE TABLE IF NOT EXISTS public.formulario_profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Informações Básicas
  nome_completo text NOT NULL,
  cpf text NOT NULL,
  data_nascimento date NOT NULL,
  cidade text NOT NULL,
  estado text NOT NULL,
  
  -- Área de Atuação
  funcao_principal text NOT NULL,
  funcao_principal_outro text,
  especialidades text[] NOT NULL,
  especialidades_outro text,
  
  -- Experiência
  tempo_experiencia text NOT NULL,
  obras_relevantes text,
  
  -- Disponibilidade
  disponibilidade_atual text NOT NULL,
  modalidade_trabalho text NOT NULL,
  regioes_atendidas text[] NOT NULL,
  cidades_frequentes text,
  
  -- Condições e Faixa de Preço
  pretensao_valor text NOT NULL,
  equipamentos_proprios text NOT NULL,
  
  -- Diferenciais
  diferenciais text[] NOT NULL,
  diferenciais_outro text,
  
  -- Documentos
  curriculo_path text,
  fotos_trabalhos_path text,
  certificacoes_path text,
  
  -- Contato
  telefone text NOT NULL,
  email text
);

-- Enable RLS
ALTER TABLE public.formulario_profissionais ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode inserir formulário de profissionais
CREATE POLICY "Qualquer um pode inserir formulário de profissionais"
ON public.formulario_profissionais
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Master admin pode visualizar formulários de profissionais
CREATE POLICY "Master admin pode visualizar formulários de profissionais"
ON public.formulario_profissionais
FOR SELECT
TO authenticated
USING (is_master_admin());