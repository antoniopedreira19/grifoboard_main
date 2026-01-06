-- As views SECURITY INVOKER herdam as RLS das tabelas base
-- Precisamos permitir SELECT nas tabelas base para que as views funcionem
-- As views já filtram as colunas sensíveis (CPF, CNPJ, data_nascimento)

-- Criar políticas de SELECT para authenticated users nas tabelas de formulários
-- Isso permite que as views funcionem corretamente

-- Profissionais
CREATE POLICY "Authenticated users can read via marketplace view"
ON public.formulario_profissionais FOR SELECT TO authenticated
USING (true);

-- Fornecedores  
CREATE POLICY "Authenticated users can read via marketplace view"
ON public.formulario_fornecedores FOR SELECT TO authenticated
USING (true);

-- Empresas
CREATE POLICY "Authenticated users can read via marketplace view"
ON public.formulario_empresas FOR SELECT TO authenticated
USING (true);

-- Também para anon (usuários não logados)
CREATE POLICY "Anon users can read via marketplace view"
ON public.formulario_profissionais FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon users can read via marketplace view"
ON public.formulario_fornecedores FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon users can read via marketplace view"
ON public.formulario_empresas FOR SELECT TO anon
USING (true);

-- =============================================
-- FIX: Ranking público - view precisa acessar gamification_profiles e usuarios
-- =============================================

-- Permitir que authenticated users leiam gamification_profiles para ranking
CREATE POLICY "Authenticated can read profiles for ranking"
ON public.gamification_profiles FOR SELECT TO authenticated
USING (true);