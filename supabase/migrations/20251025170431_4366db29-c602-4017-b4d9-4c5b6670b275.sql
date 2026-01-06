-- Add order column to tarefas table to persist drag-and-drop ordering
ALTER TABLE tarefas ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_tarefas_ordem ON tarefas(obra_id, semana, ordem);