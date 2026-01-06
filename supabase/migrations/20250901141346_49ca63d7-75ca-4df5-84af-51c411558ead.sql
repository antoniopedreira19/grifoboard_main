-- Update tarefas table structure according to user requirements
-- Add encarregado column if it doesn't exist
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS encarregado text NOT NULL DEFAULT '';

-- Copy data from equipe to encarregado if equipe exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tarefas' AND column_name = 'equipe') THEN
    UPDATE tarefas SET encarregado = equipe WHERE encarregado = '';
  END IF;
END $$;

-- Update any existing data where executor roles need to be swapped based on user's request
-- Since user said "executante" column should be "executante" and "encarregado" column should be "encarregado"
-- We need to ensure data consistency

-- Remove the old equipe column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tarefas' AND column_name = 'equipe') THEN
    ALTER TABLE tarefas DROP COLUMN equipe;
  END IF;
END $$;