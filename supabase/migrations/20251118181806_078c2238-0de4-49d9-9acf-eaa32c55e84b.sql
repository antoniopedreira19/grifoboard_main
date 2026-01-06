-- Adicionar política para permitir master_admin excluir registros de formulários

-- Política para excluir de formulario_profissionais
CREATE POLICY "Master admin pode excluir formulários de profissionais"
ON public.formulario_profissionais
FOR DELETE
TO authenticated
USING (is_master_admin());

-- Política para excluir de formulario_empresas  
CREATE POLICY "Master admin pode excluir formulários de empresas"
ON public.formulario_empresas
FOR DELETE
TO authenticated
USING (is_master_admin());

-- Política para excluir de formulario_fornecedores
CREATE POLICY "Master admin pode excluir formulários de fornecedores"
ON public.formulario_fornecedores
FOR DELETE
TO authenticated
USING (is_master_admin());