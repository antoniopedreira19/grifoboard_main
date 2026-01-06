-- Add ocorrencias column to diarios_obra table
ALTER TABLE diarios_obra ADD COLUMN IF NOT EXISTS ocorrencias text;