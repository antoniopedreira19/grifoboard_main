-- Add data_termino column to obras table
ALTER TABLE obras ADD COLUMN IF NOT EXISTS data_termino DATE;