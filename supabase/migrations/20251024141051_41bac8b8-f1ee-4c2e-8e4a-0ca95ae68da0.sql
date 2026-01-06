-- Recriar funções com SECURITY DEFINER para evitar recursão de RLS
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (role = 'admin') FROM public.usuarios WHERE id = auth.uid()
$$;

-- Recriar função de trigger com SECURITY DEFINER
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

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS set_obra_defaults ON public.obras;
CREATE TRIGGER set_obra_defaults
  BEFORE INSERT ON public.obras
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_obra_defaults();

-- Garantir que as políticas RLS estão corretas
-- Drop políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Users can view own obras" ON public.obras;

-- Políticas já existem e estão corretas, apenas garantindo que estão ativas
-- obras: select mine or company-wide if admin
-- obras: insert by user into own company
-- obras: update by owner or company admin
-- obras: delete by owner or company admin