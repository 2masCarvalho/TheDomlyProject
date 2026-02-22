-- Feature 3: Extend ativos table with Asset & License Registry fields
-- Add columns for compliance/licensing tracking
ALTER TABLE ativos
  ADD COLUMN IF NOT EXISTS tipo_ativo TEXT CHECK (tipo_ativo IN (
    'extintor', 'sadi', 'sadc', 'inspecao_gas', 'painel_solar',
    'seguro', 'licenca_elevador', 'outro'
  )),
  ADD COLUMN IF NOT EXISTS data_expiracao DATE,
  ADD COLUMN IF NOT EXISTS data_ultima_manutencao DATE,
  ADD COLUMN IF NOT EXISTS empresa_responsavel TEXT,
  ADD COLUMN IF NOT EXISTS contacto_empresa TEXT,
  ADD COLUMN IF NOT EXISTS estado_licenca TEXT CHECK (estado_licenca IN (
    'ativo', 'expirado', 'pendente_renovacao', 'desativado'
  )),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger to auto-update updated_at on ativos
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ativos_updated_at ON ativos;
CREATE TRIGGER update_ativos_updated_at
  BEFORE UPDATE ON ativos
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
