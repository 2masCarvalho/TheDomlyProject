import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useActiveCondo } from '@/context/ActiveCondoContext';
import { useAuth } from '@/context/AuthContext';
import { membershipsApi, type InviteTokenInfo } from '@/lib/api/memberships';

export default function JoinScreen() {
  const { user, profile, signOut } = useAuth();
  const { memberships, loading: membershipsLoading, refresh, setActiveCondoId } = useActiveCondo();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [info, setInfo] = useState<InviteTokenInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Residentes already in a building should not be able to redeem more invites.
  // First-time invitees (memberships.length === 0) still reach this screen via
  // (tabs)/_layout's redirect — guard only fires once memberships have loaded.
  useEffect(() => {
    if (membershipsLoading) return;
    if (memberships.length === 0) return;
    const hasTecnico = memberships.some((m) => m.role === 'tecnico');
    if (!hasTecnico) {
      router.replace('/(tabs)');
    }
  }, [memberships, membershipsLoading, router]);

  async function onValidate() {
    const trimmed = token.trim();
    if (!trimmed) {
      Alert.alert('Insere o código de convite.');
      return;
    }
    setValidating(true);
    try {
      const result = await membershipsApi.getTokenInfo(trimmed);
      if (!result) {
        Alert.alert('Convite inválido', 'O código não foi encontrado, já foi usado ou expirou.');
        setInfo(null);
        return;
      }
      setInfo(result);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível validar o convite.');
    } finally {
      setValidating(false);
    }
  }

  async function onClaim() {
    if (!info || !user || !profile) return;
    setClaiming(true);
    try {
      await membershipsApi.claimInvite(info.token.token, {
        nome: `${profile.primeiro_nome} ${profile.ultimo_nome}`.trim(),
        email: user.email ?? '',
      });
      setActiveCondoId(info.token.id_condominio);
      refresh();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível aceitar o convite.');
    } finally {
      setClaiming(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.iconWrap}>
            <Ionicons name="business" size={36} color="#2563EB" />
          </View>
          <Text style={styles.title}>Liga-te ao teu edifício</Text>
          <Text style={styles.subtitle}>
            Insere o código de convite que recebeste do gestor do condomínio. Os convites têm validade de 7 dias.
          </Text>

          <View style={styles.form}>
            <Input
              label="Código de convite"
              value={token}
              onChangeText={(t) => {
                setToken(t);
                setInfo(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="ex: a7f3e5c2b8d1f9a4..."
            />
            {!info ? (
              <Button label="Validar código" onPress={onValidate} loading={validating} />
            ) : null}
          </View>

          {info ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Edifício</Text>
              <Text style={styles.cardValue}>{info.condominio.nome}</Text>
              {info.condominio.morada ? <Text style={styles.cardMorada}>{info.condominio.morada}</Text> : null}
              <View style={styles.cardRoleRow}>
                <Text style={styles.cardLabel}>Papel</Text>
                <Text style={styles.cardRole}>{info.token.role === 'residente' ? 'Residente' : 'Técnico'}</Text>
              </View>
              <Button label="Aceitar convite" onPress={onClaim} loading={claiming} />
            </View>
          ) : null}

          {validating ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#2563EB" />
            </View>
          ) : null}

          <View style={styles.signOutRow}>
            <Button label="Sair" variant="ghost" onPress={signOut} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: 24, gap: 20, paddingBottom: 40 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  form: { gap: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardLabel: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 18, fontWeight: '600', color: '#111827' },
  cardMorada: { fontSize: 14, color: '#374151' },
  cardRoleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardRole: { fontSize: 14, fontWeight: '600', color: '#111827' },
  loading: { alignItems: 'center', paddingVertical: 8 },
  signOutRow: { marginTop: 8 },
});
