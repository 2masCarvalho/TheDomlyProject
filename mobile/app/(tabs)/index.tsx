import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useActiveCondo } from '@/context/ActiveCondoContext';
import { useAuth } from '@/context/AuthContext';
import { ocorrenciasApi, type Ocorrencia } from '@/lib/api/ocorrencias';
import { CATEGORIA_LABELS, relativeTime } from '@/lib/format';

export default function MyReportsScreen() {
  const { user } = useAuth();
  const { active } = useActiveCondo();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['my-ocorrencias', user?.id],
    queryFn: ocorrenciasApi.getMine,
    enabled: !!user,
  });

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>As minhas ocorrências</Text>
          {active ? <Text style={styles.subtitle}>{active.condominio.nome}</Text> : null}
        </View>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Sem ocorrências ainda</Text>
          <Text style={styles.emptyText}>
            Carrega no botão{' '}
            <Text style={styles.emptyEmph}>Nova</Text> em baixo para reportar a primeira.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id_ocorrencia)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <Card item={item} onPress={() => router.push(`/ocorrencia/${item.id_ocorrencia}`)} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        />
      )}
    </Screen>
  );
}

function Card({ item, onPress }: { item: Ocorrencia; onPress: () => void }) {
  const firstPhoto = item.foto_urls?.[0];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {firstPhoto ? <Image source={{ uri: firstPhoto }} style={styles.thumb} contentFit="cover" /> : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Ionicons name="image-outline" size={26} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.titulo}</Text>
        <Text style={styles.cardCategoria} numberOfLines={1}>{CATEGORIA_LABELS[item.categoria]}</Text>
        <View style={styles.cardFooter}>
          <StatusBadge estado={item.estado} />
          <Text style={styles.time}>{relativeTime(item.created_at)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 8, paddingBottom: 16, gap: 4 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardPressed: { opacity: 0.85 },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#F3F4F6' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, justifyContent: 'space-between', gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardCategoria: { fontSize: 13, color: '#6B7280' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontSize: 12, color: '#9CA3AF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  emptyEmph: { color: '#2563EB', fontWeight: '600' },
});
