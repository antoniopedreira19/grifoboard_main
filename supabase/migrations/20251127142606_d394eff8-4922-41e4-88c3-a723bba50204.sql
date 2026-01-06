-- Add user_id column to registros table and make obra_id nullable
ALTER TABLE public.registros
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make obra_id nullable to support user-level registries
ALTER TABLE public.registros
ALTER COLUMN obra_id DROP NOT NULL;

-- Add constraint: either obra_id or user_id must be set (but not both)
ALTER TABLE public.registros
ADD CONSTRAINT registros_obra_or_user_check 
CHECK (
  (obra_id IS NOT NULL AND user_id IS NULL) OR 
  (obra_id IS NULL AND user_id IS NOT NULL)
);

-- Create unique constraint for user-level registries
CREATE UNIQUE INDEX registros_user_tipo_valor_unique 
ON public.registros (user_id, tipo, valor) 
WHERE obra_id IS NULL;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can manage registros for their obras or company obras if admin" ON public.registros;
DROP POLICY IF EXISTS "pbi_read_select" ON public.registros;

-- New RLS policies for both obra-specific and user-level registries
CREATE POLICY "Users can view their own registros and obra registros"
ON public.registros
FOR SELECT
USING (
  -- User's personal registros
  (user_id = auth.uid() AND obra_id IS NULL)
  OR
  -- Obra registros they have access to
  (obra_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM obras
    WHERE obras.id = registros.obra_id 
    AND (obras.created_by = auth.uid() OR (obras.empresa_id = current_empresa_id() AND is_company_admin()))
  ))
);

CREATE POLICY "Users can insert their own registros and obra registros"
ON public.registros
FOR INSERT
WITH CHECK (
  -- User's personal registros
  (user_id = auth.uid() AND obra_id IS NULL)
  OR
  -- Obra registros they have access to
  (obra_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM obras
    WHERE obras.id = registros.obra_id 
    AND (obras.created_by = auth.uid() OR (obras.empresa_id = current_empresa_id() AND is_company_admin()))
  ))
);

CREATE POLICY "Users can update their own registros and obra registros"
ON public.registros
FOR UPDATE
USING (
  -- User's personal registros
  (user_id = auth.uid() AND obra_id IS NULL)
  OR
  -- Obra registros they have access to
  (obra_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM obras
    WHERE obras.id = registros.obra_id 
    AND (obras.created_by = auth.uid() OR (obras.empresa_id = current_empresa_id() AND is_company_admin()))
  ))
);

CREATE POLICY "Users can delete their own registros and obra registros"
ON public.registros
FOR DELETE
USING (
  -- User's personal registros
  (user_id = auth.uid() AND obra_id IS NULL)
  OR
  -- Obra registros they have access to
  (obra_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM obras
    WHERE obras.id = registros.obra_id 
    AND (obras.created_by = auth.uid() OR (obras.empresa_id = current_empresa_id() AND is_company_admin()))
  ))
);

-- Add Power BI read policy back
CREATE POLICY "pbi_read_select"
ON public.registros
AS RESTRICTIVE
FOR SELECT
USING (true);