-- Remover constraint antiga
ALTER TABLE obras DROP CONSTRAINT obras_status_check;

-- Adicionar nova constraint com nao_iniciada
ALTER TABLE obras ADD CONSTRAINT obras_status_check 
  CHECK (status = ANY (ARRAY['em_andamento'::text, 'concluida'::text, 'paralisada'::text, 'nao_iniciada'::text]));