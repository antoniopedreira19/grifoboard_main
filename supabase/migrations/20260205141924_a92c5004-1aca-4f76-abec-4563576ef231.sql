-- 1. Adicionar constraint UNIQUE para prevenir duplicação de XP
-- Primeiro, limpar duplicatas existentes (manter apenas o mais antigo)
DELETE FROM public.gamification_logs a
USING public.gamification_logs b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.reference_id = b.reference_id 
  AND a.action_type = b.action_type
  AND a.reference_id IS NOT NULL;

-- Adicionar constraint UNIQUE
ALTER TABLE public.gamification_logs 
ADD CONSTRAINT gamification_logs_unique_action 
UNIQUE NULLS NOT DISTINCT (user_id, reference_id, action_type);

-- 2. Criar função segura para dar XP (atômica e com validação)
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_action_type text,
  p_xp_amount integer,
  p_reference_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_new_log_id uuid;
  v_new_xp integer;
  v_new_level integer;
  v_valid_actions text[] := ARRAY['TAREFA_CONCLUIDA', 'DIARIO_CRIADO', 'CONTRATACAO_FAST', 'ECONOMIA_PLAYBOOK', 'PMP_ATIVIDADE_CONCLUIDA'];
  v_max_xp_per_action jsonb := '{"TAREFA_CONCLUIDA": 30, "DIARIO_CRIADO": 25, "CONTRATACAO_FAST": 50, "ECONOMIA_PLAYBOOK": 100, "PMP_ATIVIDADE_CONCLUIDA": 20}'::jsonb;
  v_max_allowed integer;
BEGIN
  -- Validar que o usuário está dando XP para si mesmo
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  -- Validar action_type permitido
  IF NOT (p_action_type = ANY(v_valid_actions)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ação inválida');
  END IF;

  -- Validar XP máximo por ação (previne manipulação)
  v_max_allowed := (v_max_xp_per_action->>p_action_type)::integer;
  IF p_xp_amount > v_max_allowed OR p_xp_amount < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'XP inválido');
  END IF;

  -- Verificar se já existe log para esta referência
  IF p_reference_id IS NOT NULL THEN
    SELECT id INTO v_existing_id 
    FROM public.gamification_logs 
    WHERE user_id = p_user_id 
      AND reference_id = p_reference_id 
      AND action_type = p_action_type;
    
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'XP já concedido', 'already_awarded', true);
    END IF;
  END IF;

  -- Inserir log (constraint UNIQUE vai prevenir duplicatas em race condition)
  INSERT INTO public.gamification_logs (user_id, action_type, xp_amount, reference_id)
  VALUES (p_user_id, p_action_type, p_xp_amount, p_reference_id)
  RETURNING id INTO v_new_log_id;

  -- Atualizar perfil (upsert)
  INSERT INTO public.gamification_profiles (id, xp_total, level_current, last_activity_date)
  VALUES (p_user_id, p_xp_amount, 1, CURRENT_DATE)
  ON CONFLICT (id) DO UPDATE SET
    xp_total = GREATEST(0, COALESCE(gamification_profiles.xp_total, 0) + p_xp_amount),
    level_current = (GREATEST(0, COALESCE(gamification_profiles.xp_total, 0) + p_xp_amount) / 1000) + 1,
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  RETURNING xp_total, level_current INTO v_new_xp, v_new_level;

  RETURN jsonb_build_object(
    'success', true, 
    'log_id', v_new_log_id,
    'xp_total', v_new_xp,
    'level', v_new_level
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Race condition - outra requisição já inseriu
    RETURN jsonb_build_object('success', false, 'error', 'XP já concedido', 'already_awarded', true);
END;
$$;

-- 3. Criar função para remover XP (quando ação é desfeita)
CREATE OR REPLACE FUNCTION public.remove_xp(
  p_user_id uuid,
  p_action_type text,
  p_reference_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_record record;
  v_new_xp integer;
  v_new_level integer;
BEGIN
  -- Validar que o usuário está removendo seu próprio XP
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  -- Buscar e deletar o log
  DELETE FROM public.gamification_logs
  WHERE user_id = p_user_id 
    AND reference_id = p_reference_id 
    AND action_type = p_action_type
  RETURNING id, xp_amount INTO v_log_record;

  IF v_log_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Log não encontrado');
  END IF;

  -- Atualizar perfil
  UPDATE public.gamification_profiles
  SET 
    xp_total = GREATEST(0, COALESCE(xp_total, 0) - COALESCE(v_log_record.xp_amount, 0)),
    level_current = (GREATEST(0, COALESCE(xp_total, 0) - COALESCE(v_log_record.xp_amount, 0)) / 1000) + 1,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING xp_total, level_current INTO v_new_xp, v_new_level;

  RETURN jsonb_build_object(
    'success', true,
    'xp_removed', v_log_record.xp_amount,
    'xp_total', COALESCE(v_new_xp, 0),
    'level', COALESCE(v_new_level, 1)
  );
END;
$$;

-- 4. Função para remover todo XP de uma obra (playbook)
CREATE OR REPLACE FUNCTION public.remove_playbook_xp(
  p_user_id uuid,
  p_obra_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_removed integer := 0;
  v_new_xp integer;
BEGIN
  -- Validar que o usuário está removendo seu próprio XP
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado');
  END IF;

  -- Calcular total a remover
  SELECT COALESCE(SUM(xp_amount), 0) INTO v_total_removed
  FROM public.gamification_logs
  WHERE user_id = p_user_id
    AND action_type IN ('ECONOMIA_PLAYBOOK', 'CONTRATACAO_FAST')
    AND reference_id LIKE p_obra_id::text || '%';

  -- Deletar logs
  DELETE FROM public.gamification_logs
  WHERE user_id = p_user_id
    AND action_type IN ('ECONOMIA_PLAYBOOK', 'CONTRATACAO_FAST')
    AND reference_id LIKE p_obra_id::text || '%';

  -- Atualizar perfil
  IF v_total_removed > 0 THEN
    UPDATE public.gamification_profiles
    SET 
      xp_total = GREATEST(0, COALESCE(xp_total, 0) - v_total_removed),
      level_current = (GREATEST(0, COALESCE(xp_total, 0) - v_total_removed) / 1000) + 1,
      updated_at = now()
    WHERE id = p_user_id
    RETURNING xp_total INTO v_new_xp;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'xp_removed', v_total_removed,
    'xp_total', COALESCE(v_new_xp, 0)
  );
END;
$$;

-- 5. Melhorar RLS para prevenir inserção manual com XP arbitrário
-- Revogar INSERT direto - forçar uso das funções
DROP POLICY IF EXISTS "Usuário cria logs" ON public.gamification_logs;

-- Nova policy: apenas as funções SECURITY DEFINER podem inserir
CREATE POLICY "Only functions can insert logs"
ON public.gamification_logs
FOR INSERT
WITH CHECK (false);  -- Bloqueia INSERT direto, funções SECURITY DEFINER bypassam

-- Manter SELECT e DELETE para o próprio usuário
-- (já existentes: "Usuário vê seus logs" e "Usuário apaga seus logs")