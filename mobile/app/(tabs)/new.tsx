import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/Button';
import { ChoicePicker } from '@/components/ChoicePicker';
import { Input } from '@/components/Input';
import { PhotoPicker } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { useActiveCondo } from '@/context/ActiveCondoContext';
import { useAuth } from '@/context/AuthContext';
import {
  ocorrenciasApi,
  type CategoriaOcorrencia,
  type PrioridadeOcorrencia,
} from '@/lib/api/ocorrencias';
import { CATEGORIA_LABELS, PRIORIDADE_LABELS } from '@/lib/format';
import { suggestFromTitulo } from '@/lib/ocorrenciaAutofill';

const schema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres'),
  descricao: z.string().optional(),
  categoria: z.enum([
    'estrutural',
    'canalização',
    'eletricidade',
    'elevador',
    'zona_comum',
    'seguranca_incendio',
    'outro',
  ]),
  prioridade: z.enum(['critica', 'alta', 'media', 'baixa']),
});

type FormValues = z.infer<typeof schema>;

const CATEGORIA_CHOICES = (Object.keys(CATEGORIA_LABELS) as CategoriaOcorrencia[]).map((v) => ({
  value: v,
  label: CATEGORIA_LABELS[v],
}));

const PRIORIDADE_CHOICES = (Object.keys(PRIORIDADE_LABELS) as PrioridadeOcorrencia[]).map((v) => ({
  value: v,
  label: PRIORIDADE_LABELS[v],
}));

export default function NewOcorrenciaScreen() {
  const { user, profile } = useAuth();
  const { active } = useActiveCondo();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: '', descricao: '', categoria: 'outro', prioridade: 'media' },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!active || !user) throw new Error('Sem condomínio ativo.');
      let fotoUrls: string[] = [];
      if (photoUris.length > 0) {
        setUploadProgress({ done: 0, total: photoUris.length });
        fotoUrls = await ocorrenciasApi.uploadPhotos(
          active.condominio.id_comdominio,
          photoUris,
          (done, total) => setUploadProgress({ done, total }),
        );
      }
      const reportadoPor = profile
        ? `${profile.primeiro_nome} ${profile.ultimo_nome}`.trim()
        : undefined;
      return ocorrenciasApi.create({
        id_condominio: active.condominio.id_comdominio,
        titulo: values.titulo.trim(),
        descricao: values.descricao?.trim() || undefined,
        categoria: values.categoria,
        prioridade: values.prioridade,
        responsabilidade: 'condominio',
        reportado_por: reportadoPor,
        foto_urls: fotoUrls.length > 0 ? fotoUrls : undefined,
        created_by: user.id,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-ocorrencias'] });
      reset();
      setPhotoUris([]);
      setUploadProgress(null);
      Alert.alert('Ocorrência reportada', 'O gestor do edifício já tem acesso.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    },
    onError: (err: any) => {
      setUploadProgress(null);
      Alert.alert('Erro ao reportar', err?.message ?? 'Tenta novamente.');
    },
  });

  function onTituloBlur() {
    const titulo = getValues('titulo');
    if (!titulo || titulo.length < 4) return;
    const suggestions = suggestFromTitulo(titulo);
    if (suggestions.categoria) setValue('categoria', suggestions.categoria, { shouldDirty: false });
    if (suggestions.prioridade) setValue('prioridade', suggestions.prioridade, { shouldDirty: false });
  }

  if (!active) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sem condomínio ativo</Text>
          <Text style={styles.emptyText}>Liga-te a um edifício para poderes reportar.</Text>
        </View>
      </Screen>
    );
  }

  const submitting = submitMutation.isPending || isSubmitting;
  const buttonLabel = uploadProgress
    ? `A enviar fotos ${uploadProgress.done}/${uploadProgress.total}…`
    : submitting
      ? 'A enviar…'
      : 'Reportar ocorrência';

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Nova ocorrência</Text>
            <Text style={styles.subtitle}>{active.condominio.nome}</Text>
          </View>

          <Controller
            control={control}
            name="titulo"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Título"
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  onBlur();
                  onTituloBlur();
                }}
                placeholder="ex: Fuga de água no elevador"
                autoCapitalize="sentences"
                error={errors.titulo?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="descricao"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Descrição (opcional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Detalhes adicionais que ajudem o gestor"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textarea}
              />
            )}
          />

          <Controller
            control={control}
            name="categoria"
            render={({ field: { onChange, value } }) => (
              <ChoicePicker
                label="Categoria"
                value={value}
                choices={CATEGORIA_CHOICES}
                onChange={onChange}
                error={errors.categoria?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="prioridade"
            render={({ field: { onChange, value } }) => (
              <ChoicePicker
                label="Prioridade"
                value={value}
                choices={PRIORIDADE_CHOICES}
                onChange={onChange}
                error={errors.prioridade?.message}
              />
            )}
          />

          <PhotoPicker uris={photoUris} onChange={setPhotoUris} max={5} />

          <Button
            label={buttonLabel}
            onPress={handleSubmit((v) => submitMutation.mutate(v))}
            loading={submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: 12, paddingBottom: 40, gap: 18 },
  header: { gap: 4, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  textarea: { minHeight: 100 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptyText: { fontSize: 14, color: '#6B7280' },
});
