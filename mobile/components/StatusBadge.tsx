import { StyleSheet, Text, View } from 'react-native';

import type { EstadoOcorrencia, PrioridadeOcorrencia } from '../lib/api/ocorrencias';
import { ESTADO_COLORS, ESTADO_LABELS, PRIORIDADE_COLORS, PRIORIDADE_LABELS } from '../lib/format';

interface Props {
  estado?: EstadoOcorrencia;
  prioridade?: PrioridadeOcorrencia;
}

export function StatusBadge({ estado, prioridade }: Props) {
  if (estado) {
    const colors = ESTADO_COLORS[estado];
    return (
      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.label, { color: colors.fg }]}>{ESTADO_LABELS[estado]}</Text>
      </View>
    );
  }
  if (prioridade) {
    const color = PRIORIDADE_COLORS[prioridade];
    return (
      <View style={[styles.badge, { backgroundColor: `${color}1A`, borderColor: color, borderWidth: 1 }]}>
        <Text style={[styles.label, { color }]}>{PRIORIDADE_LABELS[prioridade]}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 12, fontWeight: '600' },
});
