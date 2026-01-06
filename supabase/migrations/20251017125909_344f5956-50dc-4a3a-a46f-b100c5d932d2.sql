-- Add updated_at column to tarefas table
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tarefas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update updated_at on any update
DROP TRIGGER IF EXISTS set_tarefas_updated_at ON tarefas;
CREATE TRIGGER set_tarefas_updated_at
  BEFORE UPDATE ON tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_tarefas_updated_at();

-- Update existing rows to have updated_at equal to created_at
UPDATE tarefas SET updated_at = created_at WHERE updated_at IS NULL;