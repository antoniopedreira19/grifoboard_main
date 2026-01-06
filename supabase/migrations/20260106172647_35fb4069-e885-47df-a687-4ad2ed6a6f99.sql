-- =============================================
-- FASE 1: CORREÇÕES CRÍTICAS
-- =============================================

-- 1.1 Habilitar RLS na tabela documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 1.2 Habilitar RLS na tabela n8n_chat_histories
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
ON public.n8n_chat_histories
FOR SELECT
TO authenticated
USING (session_id LIKE (auth.uid()::text || '%'));

CREATE POLICY "Users can insert own chat history"
ON public.n8n_chat_histories
FOR INSERT
TO authenticated
WITH CHECK (session_id LIKE (auth.uid()::text || '%'));

-- 1.3 Adicionar policies na tabela empresas
CREATE POLICY "Users can view their own company"
ON public.empresas
FOR SELECT
TO authenticated
USING (id = public.current_empresa_id() OR public.is_master_admin());

CREATE POLICY "Master admin can manage all companies"
ON public.empresas
FOR ALL
TO authenticated
USING (public.is_master_admin())
WITH CHECK (public.is_master_admin());

-- 1.4 Recriar views como SECURITY INVOKER
DROP VIEW IF EXISTS public.ranking_grifoway;
CREATE VIEW public.ranking_grifoway
WITH (security_invoker = true)
AS
SELECT 
  u.id AS user_id,
  u.nome,
  u.empresa_id,
  COALESCE(gp.xp_total, 0) AS pontuacao_geral,
  rank() OVER (ORDER BY COALESCE(gp.xp_total, 0) DESC) AS posicao_geral,
  rank() OVER (PARTITION BY u.empresa_id ORDER BY COALESCE(gp.xp_total, 0) DESC) AS posicao_empresa
FROM public.usuarios u
LEFT JOIN public.gamification_profiles gp ON u.id = gp.id;

DROP VIEW IF EXISTS public.ranking_users_view;
CREATE VIEW public.ranking_users_view
WITH (security_invoker = true)
AS
SELECT id, nome, empresa_id FROM public.usuarios;

DROP VIEW IF EXISTS public.resumo_execucao_semanal;
CREATE VIEW public.resumo_execucao_semanal
WITH (security_invoker = true)
AS
SELECT 
  tarefas.obra_id,
  tarefas.semana,
  round((sum(CASE WHEN tarefas.percentual_executado = 1 THEN 1 ELSE 0 END)::numeric / NULLIF(count(*)::numeric, 0)), 2) AS percentual_concluido
FROM public.tarefas
GROUP BY tarefas.obra_id, tarefas.semana
ORDER BY tarefas.semana DESC;

-- =============================================
-- FASE 2: CORREÇÃO DE POLICIES PERMISSIVAS
-- =============================================

-- 2.1 Corrigir pmp_restricoes
DROP POLICY IF EXISTS "Acesso total a restrições" ON public.pmp_restricoes;
DROP POLICY IF EXISTS "Permitir tudo em restricoes" ON public.pmp_restricoes;

CREATE POLICY "Users can manage restricoes for their company"
ON public.pmp_restricoes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pmp_atividades a
    JOIN public.obras o ON a.obra_id = o.id
    WHERE a.id = pmp_restricoes.atividade_id
      AND (o.empresa_id = public.current_empresa_id() OR public.is_master_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pmp_atividades a
    JOIN public.obras o ON a.obra_id = o.id
    WHERE a.id = pmp_restricoes.atividade_id
      AND (o.empresa_id = public.current_empresa_id() OR public.is_master_admin())
  )
);

-- 2.2 Corrigir playbook_config
DROP POLICY IF EXISTS "Usuarios podem inserir/atualizar config playbook" ON public.playbook_config;
DROP POLICY IF EXISTS "Usuarios podem ver config playbook" ON public.playbook_config;

CREATE POLICY "Users can manage playbook_config for their company"
ON public.playbook_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.obras o
    WHERE o.id = playbook_config.obra_id
      AND (o.empresa_id = public.current_empresa_id() OR public.is_master_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras o
    WHERE o.id = playbook_config.obra_id
      AND (o.empresa_id = public.current_empresa_id() OR public.is_master_admin())
  )
);

-- 2.3 Corrigir playbook_items
DROP POLICY IF EXISTS "Usuarios podem inserir/atualizar itens playbook" ON public.playbook_items;
DROP POLICY IF EXISTS "Usuarios podem ver itens playbook" ON public.playbook_items;

CREATE POLICY "Users can manage playbook_items for their company"
ON public.playbook_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.obras o
    WHERE o.id = playbook_items.obra_id
      AND (o.empresa_id = public.current_empresa_id() OR public.is_master_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.obras o
    WHERE o.id = playbook_items.obra_id
      AND (o.empresa_id = public.current_empresa_id() OR public.is_master_admin())
  )
);

-- =============================================
-- FASE 3: REMOVER POLICIES DUPLICADAS
-- =============================================

DROP POLICY IF EXISTS "Public Insert Empresas" ON public.formulario_empresas;
DROP POLICY IF EXISTS "Public Insert Fornecedores" ON public.formulario_fornecedores;
DROP POLICY IF EXISTS "Public Insert Profissionais" ON public.formulario_profissionais;

-- =============================================
-- FASE 4: CORRIGIR FUNCTIONS COM SEARCH_PATH
-- =============================================

-- Atualizar current_empresa_id
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
$$;

-- Atualizar is_company_admin
CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (role = 'admin') FROM public.usuarios WHERE id = auth.uid()
$$;

-- Atualizar is_master_admin
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'master_admin'
  )
$$;

-- Atualizar check_email_exists_global
CREATE OR REPLACE FUNCTION public.check_email_exists_global(email_to_check text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text;
BEGIN
  normalized_email := lower(trim(email_to_check));
  
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE email = normalized_email) THEN
    RETURN 'usuário cadastrado';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.formulario_profissionais WHERE email = normalized_email) THEN
    RETURN 'profissional';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.formulario_empresas WHERE email_contato = normalized_email) THEN
    RETURN 'empresa';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.formulario_fornecedores WHERE email = normalized_email) THEN
    RETURN 'fornecedor';
  END IF;
  
  RETURN null;
END;
$$;

-- Atualizar get_empresas_stats
CREATE OR REPLACE FUNCTION public.get_empresas_stats()
RETURNS TABLE(id uuid, nome text, created_at timestamp with time zone, total_obras bigint, ultimo_login timestamp with time zone, total_usuarios bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id,
    e.nome,
    e.created_at,
    COUNT(DISTINCT o.id) as total_obras,
    MAX(au.last_sign_in_at) as ultimo_login,
    COUNT(DISTINCT u.id) as total_usuarios
  FROM public.empresas e
  LEFT JOIN public.usuarios u ON u.empresa_id = e.id
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN public.obras o ON o.empresa_id = e.id
  WHERE EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND role = 'master_admin'
  )
  GROUP BY e.id, e.nome, e.created_at
  ORDER BY e.created_at DESC
$$;

-- Atualizar fill_obra_defaults
CREATE OR REPLACE FUNCTION public.fill_obra_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  IF NEW.empresa_id IS NULL THEN
    SELECT u.empresa_id INTO NEW.empresa_id
    FROM public.usuarios u
    WHERE u.id = NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$;

-- Atualizar set_registro_empresa_id
CREATE OR REPLACE FUNCTION public.set_registro_empresa_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.obra_id IS NOT NULL THEN
    SELECT empresa_id INTO NEW.empresa_id
    FROM public.obras
    WHERE id = NEW.obra_id;
  ELSIF NEW.user_id IS NOT NULL THEN
    SELECT empresa_id INTO NEW.empresa_id
    FROM public.usuarios
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Atualizar link_user_to_form
CREATE OR REPLACE FUNCTION public.link_user_to_form(p_user_id uuid, p_entity_id uuid, p_entity_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_entity_type = 'profissional' THEN
    UPDATE public.formulario_profissionais 
    SET user_id = p_user_id 
    WHERE id = p_entity_id AND user_id IS NULL;
  ELSIF p_entity_type = 'empresa' THEN
    UPDATE public.formulario_empresas 
    SET user_id = p_user_id 
    WHERE id = p_entity_id AND user_id IS NULL;
  ELSIF p_entity_type = 'fornecedor' THEN
    UPDATE public.formulario_fornecedores 
    SET user_id = p_user_id 
    WHERE id = p_entity_id AND user_id IS NULL;
  ELSE
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;