-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage diarios for their obras or company obras if ad" ON diarios_obra;

-- Create new policy allowing users from the same company to manage diarios
CREATE POLICY "Users can manage diarios for their company obras"
ON diarios_obra
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM obras o
    JOIN usuarios u ON u.empresa_id = o.empresa_id
    WHERE o.id = diarios_obra.obra_id
    AND u.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM obras o
    JOIN usuarios u ON u.empresa_id = o.empresa_id
    WHERE o.id = diarios_obra.obra_id
    AND u.id = auth.uid()
  )
);