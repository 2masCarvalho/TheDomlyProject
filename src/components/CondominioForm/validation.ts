

import { z } from 'zod';

export const condominioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  morada: z.string().min(1, 'Morada é obrigatória'),
  codigo_postal: z.string().min(1, 'Código postal é obrigatório'),
  nif: z.number({ invalid_type_error: 'NIF deve ser um número' })
    .min(100000000, 'NIF inválido')
    .max(999999999, 'NIF inválido'),
  iban: z.string().optional(),
  banco: z.string().optional(),
  num_fracoes: z.number().min(0).optional(),
  num_pisos: z.number().min(0).optional(),
  ano_construcao: z.number().min(1800).max(new Date().getFullYear()).optional(),
  tem_elevador: z.boolean().optional(),
  email_geral: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  admin_externa: z.boolean().optional(),
  apolice_seguro: z.string().optional(),
  companhia_seguro: z.string().optional(),
  image_url: z.string().optional(),
});

export type CondominioFormData = z.infer<typeof condominioSchema>;
