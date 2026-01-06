-- Permitir que usuários atualizem seu próprio registro em usuarios
CREATE POLICY "Users can update own profile"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);