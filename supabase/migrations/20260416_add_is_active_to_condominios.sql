-- Soft-delete support for condominios
-- Adds is_active flag; existing rows default to true (active).
ALTER TABLE condominios
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
