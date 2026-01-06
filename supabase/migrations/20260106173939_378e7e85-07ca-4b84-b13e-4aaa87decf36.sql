-- =============================================
-- 1. VIEW PÚBLICA PARA RANKING DO GRIFOWAY
-- =============================================
-- Expõe apenas nome, XP e nível (sem email, empresa_id ou dados sensíveis)

CREATE OR REPLACE VIEW public.ranking_publico
WITH (security_invoker = true)
AS
SELECT 
  gp.id,
  u.nome,
  gp.xp_total,
  gp.level_current,
  gp.current_streak,
  -- Não expõe: email, empresa_id, last_activity_date
  ROW_NUMBER() OVER (ORDER BY gp.xp_total DESC) as posicao
FROM public.gamification_profiles gp
LEFT JOIN public.usuarios u ON u.id = gp.id
WHERE gp.xp_total > 0
ORDER BY gp.xp_total DESC;

-- Dar permissão para authenticated users
GRANT SELECT ON public.ranking_publico TO authenticated;

-- =============================================
-- 2. ATUALIZAR VIEWS DO MARKETPLACE
-- =============================================
-- Incluir email e telefone conforme solicitado pelo usuário
-- (dados de contato são intencionais para o Marketplace)

DROP VIEW IF EXISTS public.marketplace_profissionais;
DROP VIEW IF EXISTS public.marketplace_fornecedores;
DROP VIEW IF EXISTS public.marketplace_empresas;

-- View profissionais COM email e telefone (sem CPF e data_nascimento)
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
  telefone,  -- Incluído para contato
  email,     -- Incluído para contato
  logo_path,
  fotos_trabalhos_path,
  curriculo_path,
  certificacoes_path,
  selo_grifo,
  ja_trabalhou_com_grifo,
  created_at,
  user_id
  -- Omite: cpf, data_nascimento
FROM public.formulario_profissionais;

-- View fornecedores COM email e telefone (sem CNPJ/CPF)
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
  telefone,  -- Incluído para contato
  email,     -- Incluído para contato
  logo_path,
  portfolio_path,
  certificacoes_path,
  fotos_trabalhos_path,
  selo_grifo,
  ja_trabalhou_com_grifo,
  created_at,
  user_id
  -- Omite: cnpj_cpf
FROM public.formulario_fornecedores;

-- View empresas COM email e whatsapp (sem CNPJ)
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
  whatsapp_contato,  -- Incluído para contato
  email_contato,     -- Incluído para contato
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
  -- Omite: cnpj
FROM public.formulario_empresas;

-- Dar permissões nas views do Marketplace
GRANT SELECT ON public.marketplace_profissionais TO authenticated, anon;
GRANT SELECT ON public.marketplace_fornecedores TO authenticated, anon;
GRANT SELECT ON public.marketplace_empresas TO authenticated, anon;