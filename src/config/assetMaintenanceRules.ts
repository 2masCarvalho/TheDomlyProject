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
    legalReference:
      'DL 320/2002, de 28 de dezembro — Art.º 4.º e Anexo II. Manutenção mensal obrigatória por EMA (Empresa de Manutenção de Ascensores) inscrita na DGEG. Inclui inspeção, limpeza e lubrificação dos órgãos mecânicos.',
  },
  licenca_elevador: {
    label: 'Licença de elevador',
    frequencyMonths: 24,
    legalReference:
      'DL 320/2002, de 28 de dezembro — Art.º 8.º. Inspeção periódica obrigatória a cada 2 anos (bienal) após as duas primeiras inspeções quadrienais. Realizada pela câmara municipal ou entidade inspetora (EI) delegada.',
    nextDateBasis: 'ultima_manutencao',
  },
  extintor: {
    label: 'Extintor',
    frequencyMonths: 12,
    legalReference:
      'NP 4413:2019 (Norma Portuguesa — Manutenção de Extintores), de cumprimento obrigatório desde 2009 por via da Portaria n.º 1532/2008 (RT-SCIE), Art.º 163.º. Manutenção anual obrigatória por empresa certificada e registada na ANEPC. Carregamento a cada 5 anos; prova hidráulica a cada 10 anos.',
  },
  boca_incendio: {
    label: 'Boca de incêndio',
    frequencyMonths: 12,
    legalReference:
      'Portaria n.º 1532/2008, de 29 de dezembro (RT-SCIE) — Art.º 163.º, n.º 2. Manutenção anual das redes de incêndio armadas (bocas de incêndio tipo carretel e tipo teatro). Verificação trimestral de acessibilidade e estado pelo responsável de segurança.',
  },
  sadi: {
    label: 'SADI (deteção de incêndio)',
    frequencyMonths: 12,
    legalReference:
      'Portaria n.º 1532/2008, de 29 de dezembro (RT-SCIE) — Art.º 163.º, n.º 2, e NP EN 14604. Manutenção anual obrigatória dos sistemas automáticos de deteção de incêndio por empresa registada na ANEPC. Verificações trimestrais pelo responsável de segurança (teste de detetores e central).',
  },
  sadc: {
    label: 'SADC (combate a incêndio)',
    frequencyMonths: 12,
    legalReference:
      'Portaria n.º 1532/2008, de 29 de dezembro (RT-SCIE) — Art.º 163.º, n.º 2. Manutenção anual obrigatória de sistemas automáticos de extinção (sprinklers, sistemas de agente limpo, CO₂). Ensaio funcional semestral.',
  },
  detecao_gas: {
    label: 'Deteção de gás',
    frequencyMonths: 12,
    legalReference:
      'DL 97/2017, de 10 de agosto (alterado pela Lei n.º 59/2018) — Art.º 16.º, n.º 4–5 e Portaria n.º 1532/2008 — Art.º 184.º–185.º. Sistemas de deteção de CO e gás combustível devem ser mantidos anualmente conforme regras do fabricante e legislação SCIE.',
  },
  inspecao_gas: {
    label: 'Inspeção de gás',
    frequencyMonths: 60,
    legalReference:
      'DL 97/2017, de 10 de agosto (alterado pela Lei n.º 59/2018) — Art.º 21.º. Inspeção periódica obrigatória a cada 5 anos para instalações com mais de 10 anos (edifícios habitacionais). A cada 3 anos para edifícios classificados (UT III–XII). Realizada por EIG credenciada pela DGEG. Partes comuns são responsabilidade do condomínio.',
    nextDateBasis: 'instalacao',
  },
  painel_solar: {
    label: 'Painel solar',
    frequencyMonths: 12,
    legalReference:
      'DL 118/2013, de 20 de agosto (RECS/REH — regulamento de desempenho energético) e recomendações da DGEG. Manutenção anual recomendada incluindo limpeza de painéis, verificação do fluido térmico, inspeção de ligações e desempenho do sistema. Obrigatória para manter certificação energética.',
  },
  para_raios: {
    label: 'Para-raios',
    frequencyMonths: 12,
    legalReference:
      'NP EN 62305 (Proteção contra descargas atmosféricas) — Parte 3, Tabela E.2. Inspeção visual anual obrigatória e verificação completa com medição de resistência de terra a cada 2 anos. Em edifícios com materiais perigosos, inspeção semestral.',
  },
  iluminacao_emergencia: {
    label: 'Iluminação de emergência',
    frequencyMonths: 6,
    legalReference:
      'Portaria n.º 1532/2008, de 29 de dezembro (RT-SCIE) — Art.º 163.º, n.º 1, e NP EN 50172. Verificações funcionais trimestrais pelo responsável de segurança. Ensaio de autonomia completa (duração total) semestral. Manutenção por entidade registada na ANEPC anualmente.',
  },
  portas_corta_fogo: {
    label: 'Portas corta-fogo',
    frequencyMonths: 12,
    legalReference:
      'Portaria n.º 1532/2008, de 29 de dezembro (RT-SCIE) — Art.º 163.º, n.º 2, e NP EN 16034. Inspeção anual obrigatória de funcionamento, fecho automático, integridade das juntas intumescentes e vedantes. Verificação trimestral pelo responsável de segurança.',
  },
  seguro: {
    label: 'Seguro',
    frequencyMonths: 12,
    legalReference:
      'DL 268/94, de 25 de outubro — Art.º 1.º e Art.º 5.º (obrigatoriedade de seguro de incêndio para todos os edifícios em regime de propriedade horizontal). Renovação anual da apólice. O valor seguro deve corresponder ao custo de reconstrução. Incumprimento constitui contraordenação.',
    nextDateBasis: 'ultima_manutencao',
  },
  outro: {
    label: 'Outro',
    frequencyMonths: 12,
    legalReference:
      'Periodicidade definida pelo fabricante ou pelo plano de manutenção do edifício. Consultar regulamentos aplicáveis ao tipo específico de equipamento.',
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