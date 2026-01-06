-- Função para verificar se email existe em qualquer tabela do sistema
-- Retorna o nome da tabela onde o email foi encontrado, ou null se não existir
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
  
  -- Verificar em usuarios
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = normalized_email) THEN
    RETURN 'usuário cadastrado';
  END IF;
  
  -- Verificar em formulario_profissionais
  IF EXISTS (SELECT 1 FROM formulario_profissionais WHERE email = normalized_email) THEN
    RETURN 'profissional';
  END IF;
  
  -- Verificar em formulario_empresas (coluna email_contato)
  IF EXISTS (SELECT 1 FROM formulario_empresas WHERE email_contato = normalized_email) THEN
    RETURN 'empresa';
  END IF;
  
  -- Verificar em formulario_fornecedores
  IF EXISTS (SELECT 1 FROM formulario_fornecedores WHERE email = normalized_email) THEN
    RETURN 'fornecedor';
  END IF;
  
  RETURN null;
END;
$$;

-- Permitir acesso anônimo à função
GRANT EXECUTE ON FUNCTION public.check_email_exists_global(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists_global(text) TO authenticated;