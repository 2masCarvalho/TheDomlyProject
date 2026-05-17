import type { CategoriaOcorrencia, EstadoOcorrencia, PrioridadeOcorrencia } from './api/ocorrencias';

export const CATEGORIA_LABELS: Record<CategoriaOcorrencia, string> = {
  estrutural: 'Estrutural',
  'canalização': 'Canalização',
  eletricidade: 'Eletricidade',
  elevador: 'Elevador',
  zona_comum: 'Zona comum',
  seguranca_incendio: 'Segurança / incêndio',
  outro: 'Outro',
};

export const PRIORIDADE_LABELS: Record<PrioridadeOcorrencia, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const ESTADO_LABELS: Record<EstadoOcorrencia, string> = {
  reportada: 'Reportada',
  triagem: 'Em triagem',
  em_progresso: 'Em progresso',
  resolvida: 'Resolvida',
  fechada: 'Fechada',
};

export const ESTADO_COLORS: Record<EstadoOcorrencia, { bg: string; fg: string }> = {
  reportada: { bg: '#DBEAFE', fg: '#1E40AF' },
  triagem: { bg: '#EDE9FE', fg: '#6B21A8' },
  em_progresso: { bg: '#FEF3C7', fg: '#92400E' },
  resolvida: { bg: '#D1FAE5', fg: '#065F46' },
  fechada: { bg: '#E5E7EB', fg: '#374151' },
};

export const PRIORIDADE_COLORS: Record<PrioridadeOcorrencia, string> = {
  critica: '#DC2626',
  alta: '#EA580C',
  media: '#CA8A04',
  baixa: '#6B7280',
};

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `há ${day} d`;
  return new Date(iso).toLocaleDateString('pt-PT');
}
