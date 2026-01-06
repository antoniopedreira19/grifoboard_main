-- Atualizar trigger para verificar se é parceiro baseado nos metadados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Verifica se o usuário foi criado como parceiro
  IF NEW.raw_user_meta_data->>'role' = 'parceiro' THEN
    user_role_value := 'parceiro';
  ELSE
    user_role_value := 'member';
  END IF;

  INSERT INTO public.usuarios (id, nome, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, user_role_value);
  RETURN NEW;
END;
$$;