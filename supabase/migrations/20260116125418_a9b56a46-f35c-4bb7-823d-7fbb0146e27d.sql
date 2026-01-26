-- Add lucro_consolidado column to obras table
ALTER TABLE public.obras 
ADD COLUMN lucro_consolidado numeric DEFAULT 0;