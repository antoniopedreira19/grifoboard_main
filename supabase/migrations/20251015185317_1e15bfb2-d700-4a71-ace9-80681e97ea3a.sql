-- Update all existing tasks where encarregado is null or empty
-- Set encarregado to 'JOCELIO PEREIRA' for all existing records
UPDATE tarefas 
SET encarregado = 'JOCELIO PEREIRA'
WHERE encarregado IS NULL 
   OR encarregado = '' 
   OR encarregado = executante;