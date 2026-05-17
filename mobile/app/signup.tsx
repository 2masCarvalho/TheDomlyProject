import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';

const schema = z.object({
  primeiro_nome: z.string().min(1, 'Obrigatório'),
  ultimo_nome: z.string().min(1, 'Obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { primeiro_nome: '', ultimo_nome: '', email: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    try {
      await signUp({
        email: values.email.trim(),
        password: values.password,
        primeiro_nome: values.primeiro_nome.trim(),
        ultimo_nome: values.ultimo_nome.trim(),
      });
      Alert.alert(
        'Confirma o teu email',
        'Enviámos-te um email de confirmação. Confirma a tua conta e depois inicia sessão.',
        [{ text: 'OK', onPress: () => router.replace('/login') }],
      );
    } catch (err: any) {
      Alert.alert('Erro ao criar conta', err?.message ?? 'Tenta novamente.');
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Vais precisar de um código de convite do gestor do teu edifício.
          </Text>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.flexInput}>
                <Controller
                  control={control}
                  name="primeiro_nome"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <Input
                      label="Nome"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      error={errors.primeiro_nome?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.flexInput}>
                <Controller
                  control={control}
                  name="ultimo_nome"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <Input
                      label="Apelido"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      error={errors.ultimo_nome?.message}
                    />
                  )}
                />
              </View>
            </View>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Palavra-passe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete="password-new"
                  error={errors.password?.message}
                />
              )}
            />
            <Button label="Criar conta" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tens conta?</Text>
            <Link href="/login" style={styles.link}>
              Iniciar sessão
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: 32, gap: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  flexInput: { flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  footerText: { color: '#6B7280' },
  link: { color: '#2563EB', fontWeight: '600' },
});
