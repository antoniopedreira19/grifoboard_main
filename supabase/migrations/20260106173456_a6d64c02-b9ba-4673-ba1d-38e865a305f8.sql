-- Corrigir views para SECURITY INVOKER
DROP VIEW IF EXISTS public.marketplace_profissionais;
DROP VIEW IF EXISTS public.marketplace_fornecedores;
DROP VIEW IF EXISTS public.marketplace_empresas;

-- Recriar view profissionais como SECURITY INVOKER
CREATE VIEW public.marketplace_profissionais
WITH (security_invoker = true)
AS
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

-- Recriar view fornecedores como SECURITY INVOKER
CREATE VIEW public.marketplace_fornecedores
WITH (security_invoker = true)
AS
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

-- Recriar view empresas como SECURITY INVOKER
CREATE VIEW public.marketplace_empresas
WITH (security_invoker = true)
AS
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

-- Dar permissão de SELECT nas views para authenticated users
GRANT SELECT ON public.marketplace_profissionais TO authenticated;
GRANT SELECT ON public.marketplace_fornecedores TO authenticated;
GRANT SELECT ON public.marketplace_empresas TO authenticated;

-- Também dar permissão para anon (usuários não logados podem ver o marketplace)
GRANT SELECT ON public.marketplace_profissionais TO anon;
GRANT SELECT ON public.marketplace_fornecedores TO anon;
GRANT SELECT ON public.marketplace_empresas TO anon;