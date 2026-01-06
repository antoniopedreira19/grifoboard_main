-- Adicionar coluna para imagem da planta/setores do PMP
ALTER TABLE public.obras 
ADD COLUMN pmp_planta_url text;