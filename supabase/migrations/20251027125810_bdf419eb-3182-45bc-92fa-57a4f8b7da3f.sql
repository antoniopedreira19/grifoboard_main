-- Add trigger to fill obra defaults (created_by and empresa_id)
CREATE TRIGGER fill_obra_defaults_trigger
  BEFORE INSERT ON public.obras
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_obra_defaults();