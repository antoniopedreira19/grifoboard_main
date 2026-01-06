-- Atualizar função para não mostrar usuários com XP zerado
CREATE OR REPLACE FUNCTION public.get_grifoway_ranking(
  p_empresa_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  user_id uuid,
  nome text,
  pontuacao_geral integer,
  posicao integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Somente usuários autenticados
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Se pedir ranking por empresa, só permitir a própria empresa (ou master_admin)
  IF p_empresa_id IS NOT NULL
     AND p_empresa_id IS DISTINCT FROM current_empresa_id()
     AND NOT is_master_admin() THEN
    RETURN;
  END IF;

  IF p_empresa_id IS NULL THEN
    -- Ranking Geral - apenas usuários com XP > 0
    RETURN QUERY
    SELECT
      u.id AS user_id,
      COALESCE(u.nome, 'Usuário Grifo')::text AS nome,
      COALESCE(gp.xp_total, 0)::int AS pontuacao_geral,
      RANK() OVER (ORDER BY COALESCE(gp.xp_total, 0) DESC)::int AS posicao
    FROM public.usuarios u
    LEFT JOIN public.gamification_profiles gp ON gp.id = u.id
    WHERE COALESCE(gp.xp_total, 0) > 0
    ORDER BY COALESCE(gp.xp_total, 0) DESC
    LIMIT COALESCE(p_limit, 20);
  ELSE
    -- Ranking da Empresa - apenas usuários com XP > 0
    RETURN QUERY
    SELECT
      u.id AS user_id,
      COALESCE(u.nome, 'Usuário Grifo')::text AS nome,
      COALESCE(gp.xp_total, 0)::int AS pontuacao_geral,
      RANK() OVER (ORDER BY COALESCE(gp.xp_total, 0) DESC)::int AS posicao
    FROM public.usuarios u
    LEFT JOIN public.gamification_profiles gp ON gp.id = u.id
    WHERE u.empresa_id = p_empresa_id
      AND COALESCE(gp.xp_total, 0) > 0
    ORDER BY COALESCE(gp.xp_total, 0) DESC
    LIMIT COALESCE(p_limit, 20);
  END IF;
END;
$$;