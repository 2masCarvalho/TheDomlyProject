-- Make nif nullable so buildings can be created without a NIF (e.g. during onboarding)
-- PostgreSQL unique constraints allow multiple NULL values, so this is safe
ALTER TABLE condominios ALTER COLUMN nif DROP NOT NULL;
ALTER TABLE condominios ALTER COLUMN nif SET DEFAULT NULL;
