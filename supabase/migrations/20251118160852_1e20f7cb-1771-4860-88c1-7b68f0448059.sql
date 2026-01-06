-- Add master_admin to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'master_admin';

-- Add last_login column to usuarios table to track last access
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;