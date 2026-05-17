import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useActiveCondo } from '@/context/ActiveCondoContext';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user, loading: authLoading } = useAuth();
  const { memberships, loading: condoLoading } = useActiveCondo();

  if (authLoading || condoLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (memberships.length === 0) return <Redirect href="/join" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
        tabBarStyle: { borderTopColor: '#E5E7EB' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'Nova',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size + 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
