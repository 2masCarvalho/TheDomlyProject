-- Add image_url column to condominios table
ALTER TABLE condominios
ADD COLUMN IF NOT EXISTS image_url TEXT;
