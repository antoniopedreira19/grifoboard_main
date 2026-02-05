-- Adicionar política para permitir leitura de logs de usuários da mesma empresa
CREATE POLICY "Users can view logs from same company"
ON public.gamification_logs
FOR SELECT
USING (
  user_id IN (
    SELECT u.id FROM public.usuarios u 
    WHERE u.empresa_id = current_empresa_id()
  )
);