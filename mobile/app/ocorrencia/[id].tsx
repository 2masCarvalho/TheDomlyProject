import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/StatusBadge';
import { ocorrenciasApi, type EstadoOcorrencia } from '@/lib/api/ocorrencias';
import { CATEGORIA_LABELS, ESTADO_LABELS, PRIORIDADE_LABELS, relativeTime } from '@/lib/format';

const TIMELINE_ORDER: EstadoOcorrencia[] = ['reportada', 'triagem', 'em_progresso', 'resolvida'];

export default function OcorrenciaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const [zoomUri, setZoomUri] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ocorrencia', numericId],
    queryFn: () => ocorrenciasApi.getById(numericId),
    enabled: !Number.isNaN(numericId),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Não foi possível carregar a ocorrência.</Text>
      </View>
    );
  }

  const estadoIndex = TIMELINE_ORDER.indexOf(data.estado);
  const isClosed = data.estado === 'fechada';

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.titulo}</Text>
        <View style={styles.metaRow}>
          <StatusBadge estado={data.estado} />
          <StatusBadge prioridade={data.prioridade} />
        </View>
        <Text style={styles.timestamp}>Reportada {relativeTime(data.created_at)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Categoria</Text>
        <Text style={styles.sectionValue}>{CATEGORIA_LABELS[data.categoria]}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Prioridade</Text>
        <Text style={styles.sectionValue}>{PRIORIDADE_LABELS[data.prioridade]}</Text>
      </View>

      {data.descricao ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Descrição</Text>
          <Text style={styles.description}>{data.descricao}</Text>
        </View>
      ) : null}

      {data.foto_urls && data.foto_urls.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fotografias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {data.foto_urls.map((uri, i) => (
              <Pressable key={`${uri}-${i}`} onPress={() => setZoomUri(uri)}>
                <Image source={{ uri }} style={styles.photo} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Estado</Text>
        <View style={styles.timeline}>
          {TIMELINE_ORDER.map((step, i) => {
            const reached = i <= estadoIndex || isClosed;
            const isCurrent = i === estadoIndex && !isClosed;
            return (
              <View key={step} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    reached && styles.timelineDotReached,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                >
                  {reached && !isCurrent ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                </View>
                <Text style={[styles.timelineLabel, reached && styles.timelineLabelReached]}>
                  {ESTADO_LABELS[step]}
                </Text>
              </View>
            );
          })}
          {isClosed ? (
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, styles.timelineDotReached]}>
                <Ionicons name="archive" size={12} color="#fff" />
              </View>
              <Text style={[styles.timelineLabel, styles.timelineLabelReached]}>Fechada</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Modal visible={!!zoomUri} transparent animationType="fade" onRequestClose={() => setZoomUri(null)}>
        <Pressable style={styles.zoomBackdrop} onPress={() => setZoomUri(null)}>
          {zoomUri ? <Image source={{ uri: zoomUri }} style={styles.zoomImage} contentFit="contain" /> : null}
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F9FAFB' },
  errorText: { fontSize: 15, color: '#6B7280' },
  header: { gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  timestamp: { fontSize: 13, color: '#6B7280' },
  section: { gap: 6, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionLabel: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  sectionValue: { fontSize: 15, color: '#111827', fontWeight: '500' },
  description: { fontSize: 15, color: '#111827', lineHeight: 22 },
  photoRow: { gap: 10, paddingTop: 4 },
  photo: { width: 140, height: 140, borderRadius: 10 },
  timeline: { gap: 14, paddingTop: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotReached: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  timelineDotCurrent: { backgroundColor: '#fff', borderColor: '#2563EB', borderWidth: 3 },
  timelineLabel: { fontSize: 14, color: '#9CA3AF' },
  timelineLabelReached: { color: '#111827', fontWeight: '500' },
  zoomBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  zoomImage: { width: '100%', height: '100%' },
});
