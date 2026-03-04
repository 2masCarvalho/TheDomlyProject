import type { CategoriaOcorrencia, PrioridadeOcorrencia } from '@/api/ocorrencias';

export type OcorrenciaSuggestions = {
  categoria?: CategoriaOcorrencia;
  prioridade?: PrioridadeOcorrencia;
};

function norm(input: string) {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((k) => text.includes(k));
}

export function suggestFromTitulo(titulo: string): OcorrenciaSuggestions {
  const t = norm(titulo);
  if (!t) return {};

  let prioridade: PrioridadeOcorrencia | undefined;
  if (
    includesAny(t, [
      'incendio',
      'fogo',
      'fumaca',
      'explosao',
      'perigo',
      'risco',
      'inundacao',
      'inundou',
      'choque eletrico',
      'curto circuito',
      'fuga de gas',
      'gas',
    ])
  ) {
    prioridade = 'critica';
  } else if (includesAny(t, ['urgente', 'imediato', 'avaria', 'sem elevador', 'preso no elevador'])) {
    prioridade = 'alta';
  } else {
    prioridade = 'media';
  }

  let categoria: CategoriaOcorrencia | undefined;
  if (
    includesAny(t, [
      'fuga',
      'agua',
      'cano',
      'canalizacao',
      'entupido',
      'infiltracao',
      'torneira',
      'sanita',
      'esgoto',
      'rutura',
      'ruptura',
    ])
  ) {
    categoria = 'canalização';
  } else if (includesAny(t, ['disjuntor', 'luz', 'tomada', 'interruptor', 'curto', 'eletricidade', 'eletrico'])) {
    categoria = 'eletricidade';
  } else if (includesAny(t, ['elevador', 'cabine', 'porta do elevador'])) {
    categoria = 'elevador';
  } else if (includesAny(t, ['extintor', 'alarme', 'incendio', 'fumo', 'fumaca', 'detetor', 'detector'])) {
    categoria = 'seguranca_incendio';
  } else if (includesAny(t, ['escadas', 'fachada', 'parede', 'teto', 'tecto', 'chao', 'piso', 'rachadura'])) {
    categoria = 'estrutural';
  } else if (includesAny(t, ['porta', 'corrimao', 'garagem', 'hall', 'entrada', 'jardim', 'portao', 'portao'])) {
    categoria = 'zona_comum';
  } else {
    categoria = 'outro';
  }

  return { categoria, prioridade };
}

