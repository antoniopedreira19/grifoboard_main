-- Atualizar a função award_xp para incluir PMP_RESTRICAO_CONCLUIDA
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
  v_valid_actions text[] := ARRAY['TAREFA_CONCLUIDA', 'DIARIO_CRIADO', 'CONTRATACAO_FAST', 'ECONOMIA_PLAYBOOK', 'PMP_ATIVIDADE_CONCLUIDA', 'PMP_RESTRICAO_CONCLUIDA'];
  v_max_xp_per_action jsonb := '{"TAREFA_CONCLUIDA": 30, "DIARIO_CRIADO": 25, "CONTRATACAO_FAST": 50, "ECONOMIA_PLAYBOOK": 100, "PMP_ATIVIDADE_CONCLUIDA": 50, "PMP_RESTRICAO_CONCLUIDA": 20}'::jsonb;
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