import { z } from 'zod';

export const condominioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  morada: z.string().min(1, 'Morada é obrigatória'),
  codigo_postal: z.string().min(1, 'Código postal é obrigatório'),
  nif: z.number({ invalid_type_error: 'NIF deve ser um número' })
    .min(100000000, 'NIF deve ter 9 dígitos')
    .max(999999999, 'NIF deve ter 9 dígitos'),
  iban: z.string().min(1, 'IBAN é obrigatório'),
  banco: z.string().min(1, 'Banco é obrigatório'),
  num_fracoes: z.number().min(1, 'Mínimo 1 fração'),
  num_pisos: z.number().min(1, 'Mínimo 1 piso'),
  ano_construcao: z.number().min(1800, 'Ano inválido').max(new Date().getFullYear(), 'Ano inválido'),
  tem_elevador: z.boolean().default(false),
  email_geral: z.string().email('Email inválido'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  // APENAS A IMAGEM É OPCIONAL
  image_url: z.string().optional().nullable().or(z.literal('')),
});

export type CondominioFormData = z.infer<typeof condominioSchema>;