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
    legalReference: 'DL n.º 320/2002, de 28 dez. (Regulamento de Segurança de Elevadores) — manutenção mensal obrigatória por empresa certificada.',
  },
  licenca_elevador: {
    label: 'Licença de elevador',
    frequencyMonths: 12,
    legalReference: 'DL n.º 320/2002, de 28 dez., art. 12.º — inspeção periódica bienal por OIT acreditado; licença emitida pelo município.',
    nextDateBasis: 'ultima_manutencao',
  },
  extintor: {
    label: 'Extintor',
    frequencyMonths: 12,
    legalReference: 'Portaria n.º 1276/2002, de 19 set. (SCIE) e NP 4413:2012 — verificação anual e recarga quinquenal por empresa certificada.',
  },
  boca_incendio: {
    label: 'Boca de incêndio',
    frequencyMonths: 12,
    legalReference: 'DL n.º 220/2008, de 12 nov. (RJSCIE), Portaria n.º 1532/2008, art. 163.º — inspeção e teste anual das redes de incêndio armadas.',
  },
  sadi: {
    label: 'SADI (deteção de incêndio)',
    frequencyMonths: 6,
    legalReference: 'DL n.º 220/2008 (RJSCIE) e NP EN 54-14:2006 — manutenção semestral e teste anual do sistema automático de deteção de incêndio.',
  },
  sadc: {
    label: 'SADC (combate a incêndio)',
    frequencyMonths: 6,
    legalReference: 'DL n.º 220/2008 (RJSCIE), Portaria n.º 1532/2008, art. 185.º — inspeção semestral e teste anual dos sistemas de supressão/sprinklers.',
  },
  detecao_gas: {
    label: 'Deteção de gás',
    frequencyMonths: 12,
    legalReference: 'DL n.º 521/99, de 10 dez. (instalações de gás) e NP EN 50194/50291 — verificação anual dos detetores de gás por técnico habilitado.',
  },
  inspecao_gas: {
    label: 'Inspeção de gás',
    frequencyMonths: 60,
    legalReference: 'DL n.º 263/89, de 17 ago., e Portaria n.º 361/98, de 26 jun. — inspeção periódica de 5 anos das instalações de gás por OIE acreditado.',
    nextDateBasis: 'instalacao',
  },
  painel_solar: {
    label: 'Painel solar',
    frequencyMonths: 12,
    legalReference: 'DL n.º 153/2014, de 20 out. (UPAC/UPP) e DL n.º 118/2013 (SCE) — manutenção anual prevista no plano de manutenção do sistema solar.',
  },
  para_raios: {
    label: 'Para-raios',
    frequencyMonths: 12,
    legalReference: 'NP EN 62305-3:2012 (SPDA) e Portaria n.º 1532/2008, art. 71.º — inspeção anual do sistema de proteção contra descargas atmosféricas.',
  },
  iluminacao_emergencia: {
    label: 'Iluminação de emergência',
    frequencyMonths: 6,
    legalReference: 'DL n.º 220/2008 (RJSCIE), Portaria n.º 1532/2008, art. 113.º, e NP EN 50172:2004 — teste funcional mensal e inspeção semestral.',
  },
  portas_corta_fogo: {
    label: 'Portas corta-fogo',
    frequencyMonths: 12,
    legalReference: 'DL n.º 220/2008 (RJSCIE), Portaria n.º 1532/2008, art. 26.º — verificação anual do funcionamento e integridade de portas resistentes ao fogo.',
  },
  seguro: {
    label: 'Seguro',
    frequencyMonths: 12,
    legalReference: 'DL n.º 268/94, de 25 out. (Propriedade Horizontal), art. 1429.º-A CC — seguro de incêndio obrigatório; renovação anual da apólice.',
    nextDateBasis: 'ultima_manutencao',
  },
  outro: {
    label: 'Outro',
    frequencyMonths: 12,
    legalReference: 'Consulte a legislação aplicável ao equipamento específico.',
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

