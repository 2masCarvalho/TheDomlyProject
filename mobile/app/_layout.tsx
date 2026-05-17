import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ActiveCondoProvider } from '@/context/ActiveCondoContext';
import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveCondoProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="join" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="ocorrencia/[id]"
                options={{ headerShown: true, title: 'Ocorrência', headerBackTitle: 'Voltar' }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ActiveCondoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
