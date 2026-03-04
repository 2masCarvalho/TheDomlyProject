import { z } from 'zod';

export const condominioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cidade: z.string().optional().nullable().or(z.literal('')),
  morada: z.string().min(1, 'Morada é obrigatória'),
  codigo_postal: z.string().optional().nullable().or(z.literal('')),
  nif: z.number({ invalid_type_error: 'NIF deve ser um número' })
    .min(100000000, 'NIF deve ter 9 dígitos')
    .max(999999999, 'NIF deve ter 9 dígitos'),
  iban: z.string().optional().nullable().or(z.literal('')),
  banco: z.string().optional().nullable().or(z.literal('')),
  num_fracoes: z.number().min(1, 'Mínimo 1 fração'),
  num_pisos: z.number().optional().nullable(),
  ano_construcao: z.number().optional().nullable(),
  tem_elevador: z.boolean().default(false),
  email_geral: z.string().optional().nullable().or(z.literal('')).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Email inválido',
  }),
  telefone: z.string().optional().nullable().or(z.literal('')),
  // APENAS A IMAGEM É OPCIONAL
  image_url: z.string().optional().nullable().or(z.literal('')),
});

export type CondominioFormData = z.infer<typeof condominioSchema>;