import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useActiveCondo } from '@/context/ActiveCondoContext';
import { useAuth } from '@/context/AuthContext';

export default function IndexRoute() {
  const { user, loading: authLoading } = useAuth();
  const { memberships, loading: condoLoading } = useActiveCondo();

  if (authLoading || (user && condoLoading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (memberships.length === 0) return <Redirect href="/join" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
});
