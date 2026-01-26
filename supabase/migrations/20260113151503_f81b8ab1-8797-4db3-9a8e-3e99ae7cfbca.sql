-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "obras: select mine or company-wide if admin" ON public.obras;

-- Create new SELECT policy that includes usuario_id (responsável)
CREATE POLICY "obras: select by creator, responsible, or company admin"
ON public.obras
FOR SELECT
USING (
  (created_by = auth.uid())
  OR (usuario_id = auth.uid())
  OR ((empresa_id = current_empresa_id()) AND is_company_admin())
);

-- Also update UPDATE policy to allow responsável to update
DROP POLICY IF EXISTS "obras: update by owner or company admin" ON public.obras;

CREATE POLICY "obras: update by creator, responsible, or company admin"
ON public.obras
FOR UPDATE
USING (
  (created_by = auth.uid())
  OR (usuario_id = auth.uid())
  OR ((empresa_id = current_empresa_id()) AND is_company_admin())
)
WITH CHECK (NOT (empresa_id IS DISTINCT FROM current_empresa_id()));