-- Adicionar coluna selo_grifo nas três tabelas de formulário
ALTER TABLE public.formulario_profissionais 
ADD COLUMN selo_grifo boolean DEFAULT false;

ALTER TABLE public.formulario_empresas 
ADD COLUMN selo_grifo boolean DEFAULT false;

ALTER TABLE public.formulario_fornecedores 
ADD COLUMN selo_grifo boolean DEFAULT false;