-- Add empresa_id column to registros table
ALTER TABLE public.registros
ADD COLUMN empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Create index for better performance on empresa_id lookups
CREATE INDEX idx_registros_empresa_id ON public.registros(empresa_id);

-- Update existing registros to populate empresa_id from obras
UPDATE public.registros r
SET empresa_id = o.empresa_id
FROM public.obras o
WHERE r.obra_id = o.id AND r.obra_id IS NOT NULL;

-- Update existing user-level registros to populate empresa_id from usuarios
UPDATE public.registros r
SET empresa_id = u.empresa_id
FROM public.usuarios u
WHERE r.user_id = u.id AND r.user_id IS NOT NULL;

-- Create trigger to automatically set empresa_id on insert
CREATE OR REPLACE FUNCTION public.set_registro_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If obra_id is set, get empresa_id from obra
  IF NEW.obra_id IS NOT NULL THEN
    SELECT empresa_id INTO NEW.empresa_id
    FROM public.obras
    WHERE id = NEW.obra_id;
  -- If user_id is set, get empresa_id from user
  ELSIF NEW.user_id IS NOT NULL THEN
    SELECT empresa_id INTO NEW.empresa_id
    FROM public.usuarios
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_set_registro_empresa_id
BEFORE INSERT ON public.registros
FOR EACH ROW
EXECUTE FUNCTION public.set_registro_empresa_id();