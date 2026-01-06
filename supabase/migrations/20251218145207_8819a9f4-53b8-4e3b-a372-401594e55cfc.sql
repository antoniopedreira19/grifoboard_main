-- Add UPDATE policies for master_admin on all form tables

-- Formulario Profissionais - Master admin can update
CREATE POLICY "Master admin pode atualizar formulários de profissionais"
ON public.formulario_profissionais
FOR UPDATE
USING (is_master_admin())
WITH CHECK (is_master_admin());

-- Formulario Empresas - Master admin can update
CREATE POLICY "Master admin pode atualizar formulários de empresas"
ON public.formulario_empresas
FOR UPDATE
USING (is_master_admin())
WITH CHECK (is_master_admin());

-- Formulario Fornecedores - Master admin can update
CREATE POLICY "Master admin pode atualizar formulários de fornecedores"
ON public.formulario_fornecedores
FOR UPDATE
USING (is_master_admin())
WITH CHECK (is_master_admin());