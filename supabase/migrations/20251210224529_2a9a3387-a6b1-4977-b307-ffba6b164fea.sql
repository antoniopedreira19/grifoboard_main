-- Allow authenticated users to view formulario_profissionais for marketplace
CREATE POLICY "Authenticated users can view profissionais for marketplace"
ON public.formulario_profissionais
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view formulario_empresas for marketplace  
CREATE POLICY "Authenticated users can view empresas for marketplace"
ON public.formulario_empresas
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view formulario_fornecedores for marketplace
CREATE POLICY "Authenticated users can view fornecedores for marketplace"
ON public.formulario_fornecedores
FOR SELECT
TO authenticated
USING (true);