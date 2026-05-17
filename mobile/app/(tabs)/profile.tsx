import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useActiveCondo } from '@/context/ActiveCondoContext';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const { memberships, active, setActiveCondoId } = useActiveCondo();
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          <View>
            <Text style={styles.name}>
              {profile ? `${profile.primeiro_nome} ${profile.ultimo_nome}`.trim() : 'Residente'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edifícios</Text>
          {memberships.length === 0 ? (
            <Text style={styles.empty}>Sem edifícios associados.</Text>
          ) : (
            memberships.map((m) => {
              const isActive = m.condominio.id_comdominio === active?.condominio.id_comdominio;
              return (
                <View key={m.condominio.id_comdominio} style={[styles.condo, isActive && styles.condoActive]}>
                  <View style={styles.condoBody}>
                    <Text style={styles.condoName}>{m.condominio.nome}</Text>
                    <Text style={styles.condoMeta}>
                      {m.role === 'residente' ? 'Residente' : 'Técnico'} · {m.condominio.cidade}
                    </Text>
                  </View>
                  {isActive ? (
                    <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
                  ) : (
                    <Button
                      label="Selecionar"
                      variant="secondary"
                      onPress={() => setActiveCondoId(m.condominio.id_comdominio)}
                    />
                  )}
                </View>
              );
            })
          )}
          <Button label="Adicionar outro edifício" variant="secondary" onPress={() => router.push('/join')} />
        </View>

        <View style={styles.section}>
          <Button label="Terminar sessão" variant="ghost" onPress={signOut} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingVertical: 24, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { fontSize: 14, color: '#6B7280' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { fontSize: 14, color: '#6B7280' },
  condo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  condoActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  condoBody: { flex: 1, gap: 2 },
  condoName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  condoMeta: { fontSize: 13, color: '#6B7280' },
});
