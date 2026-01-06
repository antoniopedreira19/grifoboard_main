-- Fix security issue: Set search_path for the function
CREATE OR REPLACE FUNCTION public.update_materiais_tarefa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;