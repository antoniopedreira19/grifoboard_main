-- Adicionar 'parceiro' ao enum user_role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'parceiro';

-- Criar política para permitir que parceiros vejam seu próprio role
CREATE POLICY "Parceiros podem ver seu próprio role"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);