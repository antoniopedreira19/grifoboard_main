-- Função para vincular user_id ao registro do formulário após signup
-- Usa SECURITY DEFINER para bypass de RLS
CREATE OR REPLACE FUNCTION public.link_user_to_form(
  p_user_id uuid,
  p_entity_id uuid,
  p_entity_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_entity_type = 'profissional' THEN
    UPDATE formulario_profissionais 
    SET user_id = p_user_id 
    WHERE id = p_entity_id AND user_id IS NULL;
  ELSIF p_entity_type = 'empresa' THEN
    UPDATE formulario_empresas 
    SET user_id = p_user_id 
    WHERE id = p_entity_id AND user_id IS NULL;
  ELSIF p_entity_type = 'fornecedor' THEN
    UPDATE formulario_fornecedores 
    SET user_id = p_user_id 
    WHERE id = p_entity_id AND user_id IS NULL;
  ELSE
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Permitir acesso à função para usuários autenticados
GRANT EXECUTE ON FUNCTION public.link_user_to_form(uuid, uuid, text) TO authenticated;