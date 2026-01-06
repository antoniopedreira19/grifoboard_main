-- Remove the deprecated pgjwt extension
-- This extension is no longer maintained and should be removed before PostgreSQL upgrade
DROP EXTENSION IF EXISTS pgjwt CASCADE;