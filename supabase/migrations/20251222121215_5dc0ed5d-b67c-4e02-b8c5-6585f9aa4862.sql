-- Política para permitir que usuários vejam outros usuários da mesma empresa (para ranking)
CREATE POLICY "Users can view colleagues in same company" 
ON public.usuarios 
FOR SELECT 
USING (
  empresa_id IS NOT NULL 
  AND empresa_id = (
    SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()
  )
);