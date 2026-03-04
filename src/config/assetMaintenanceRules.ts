export type AssetType =
  | 'elevador'
  | 'extintor'
  | 'boca_incendio'
  | 'sadi'
  | 'sadc'
  | 'detecao_gas'
  | 'inspecao_gas'
  | 'painel_solar'
  | 'para_raios'
  | 'iluminacao_emergencia'
  | 'portas_corta_fogo'
  | 'seguro'
  | 'licenca_elevador'
  | 'outro';

export type MaintenanceRule = {
  label: string;
  frequencyMonths: number;
  legalReference: string;
  nextDateBasis?: 'instalacao' | 'ultima_manutencao';
};

export const maintenanceRulesByType: Record<AssetType, MaintenanceRule> = {
  elevador: {
    label: 'Elevador',
    frequencyMonths: 1,
    legalReference: 'Referência legal a confirmar (manutenção periódica de elevadores).',
  },
  licenca_elevador: {
    label: 'Licença de elevador',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar (licenciamento/inspeções de elevadores).',
    nextDateBasis: 'ultima_manutencao',
  },
  extintor: {
    label: 'Extintor',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar (manutenção/inspeção de extintores).',
  },
  boca_incendio: {
    label: 'Boca de incêndio',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar (inspeção de bocas de incêndio).',
  },
  sadi: {
    label: 'SADI (deteção de incêndio)',
    frequencyMonths: 6,
    legalReference: 'Referência legal a confirmar (manutenção de sistemas automáticos de deteção).',
  },
  sadc: {
    label: 'SADC (combate a incêndio)',
    frequencyMonths: 6,
    legalReference: 'Referência legal a confirmar (manutenção de sistemas de combate a incêndio).',
  },
  detecao_gas: {
    label: 'Deteção de gás',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar (verificação de sistemas de deteção de gás).',
  },
  inspecao_gas: {
    label: 'Inspeção de gás',
    frequencyMonths: 60,
    legalReference: 'Referência legal a confirmar (periodicidade de inspeções de gás).',
    nextDateBasis: 'instalacao',
  },
  painel_solar: {
    label: 'Painel solar',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar (manutenção/inspeção de sistemas solares).',
  },
  para_raios: {
    label: 'Para-raios',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar (inspeção de SPDA/para-raios).',
  },
  iluminacao_emergencia: {
    label: 'Iluminação de emergência',
    frequencyMonths: 6,
    legalReference: 'Referência legal a confirmar (testes periódicos de iluminação de emergência).',
  },
  portas_corta_fogo: {
    label: 'Portas corta-fogo',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar (verificação/inspeção de portas corta-fogo).',
  },
  seguro: {
    label: 'Seguro',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar (renovação anual de apólices).',
    nextDateBasis: 'ultima_manutencao',
  },
  outro: {
    label: 'Outro',
    frequencyMonths: 12,
    legalReference: 'Referência legal a confirmar.',
  },
};

export const assetTypeOptions: Array<{ value: AssetType; label: string }> = Object.entries(
  maintenanceRulesByType,
).map(([value, rule]) => ({ value: value as AssetType, label: rule.label }));

export function getRuleForType(type?: string | null): MaintenanceRule | null {
  if (!type) return null;
  if (type in maintenanceRulesByType) return maintenanceRulesByType[type as AssetType];
  return null;
}

