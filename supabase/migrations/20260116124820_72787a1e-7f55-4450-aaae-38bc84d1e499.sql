-- Drop existing policies on registros
DROP POLICY IF EXISTS "Users can view their own registros and obra registros" ON public.registros;
DROP POLICY IF EXISTS "Users can insert their own registros and obra registros" ON public.registros;
DROP POLICY IF EXISTS "Users can update their own registros and obra registros" ON public.registros;
DROP POLICY IF EXISTS "Users can delete their own registros and obra registros" ON public.registros;

-- SELECT: Allow users to see registros for obras they are responsible for
CREATE POLICY "Users can view their own registros and obra registros"
ON public.registros
FOR SELECT
USING (
  ((user_id = auth.uid()) AND (obra_id IS NULL))
  OR (
    (obra_id IS NOT NULL) AND (
      EXISTS (
        SELECT 1 FROM obras
        WHERE obras.id = registros.obra_id
        AND (
          obras.created_by = auth.uid()
          OR obras.usuario_id = auth.uid()
          OR ((obras.empresa_id = current_empresa_id()) AND is_company_admin())
        )
      )
    )
  )
);

-- INSERT: Allow users to insert registros for obras they are responsible for
CREATE POLICY "Users can insert their own registros and obra registros"
ON public.registros
FOR INSERT
WITH CHECK (
  ((user_id = auth.uid()) AND (obra_id IS NULL))
  OR (
    (obra_id IS NOT NULL) AND (
      EXISTS (
        SELECT 1 FROM obras
        WHERE obras.id = registros.obra_id
        AND (
          obras.created_by = auth.uid()
          OR obras.usuario_id = auth.uid()
          OR ((obras.empresa_id = current_empresa_id()) AND is_company_admin())
        )
      )
    )
  )
);

-- UPDATE: Allow users to update registros for obras they are responsible for
CREATE POLICY "Users can update their own registros and obra registros"
ON public.registros
FOR UPDATE
USING (
  ((user_id = auth.uid()) AND (obra_id IS NULL))
  OR (
    (obra_id IS NOT NULL) AND (
      EXISTS (
        SELECT 1 FROM obras
        WHERE obras.id = registros.obra_id
        AND (
          obras.created_by = auth.uid()
          OR obras.usuario_id = auth.uid()
          OR ((obras.empresa_id = current_empresa_id()) AND is_company_admin())
        )
      )
    )
  )
);

-- DELETE: Allow users to delete registros for obras they are responsible for
CREATE POLICY "Users can delete their own registros and obra registros"
ON public.registros
FOR DELETE
USING (
  ((user_id = auth.uid()) AND (obra_id IS NULL))
  OR (
    (obra_id IS NOT NULL) AND (
      EXISTS (
        SELECT 1 FROM obras
        WHERE obras.id = registros.obra_id
        AND (
          obras.created_by = auth.uid()
          OR obras.usuario_id = auth.uid()
          OR ((obras.empresa_id = current_empresa_id()) AND is_company_admin())
        )
      )
    )
  )
);