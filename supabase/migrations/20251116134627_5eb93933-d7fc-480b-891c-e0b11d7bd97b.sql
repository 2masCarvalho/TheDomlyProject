-- Add n_fracoes and contacto_administrador columns to condominio table
ALTER TABLE public.condominio 
ADD COLUMN n_fracoes INTEGER,
ADD COLUMN contacto_administrador TEXT;