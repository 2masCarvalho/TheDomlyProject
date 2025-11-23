

import { z } from 'zod';

export const condominioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  morada: z.string().min(1, 'Morada é obrigatória'),
  codigo_postal: z.string().min(1, 'Código postal é obrigatório'),
  nif: z.number({ invalid_type_error: 'NIF deve ser um número' })
         .min(100000000, 'NIF inválido')
         .max(999999999, 'NIF inválido'),
});

export type CondominioFormData = z.infer<typeof condominioSchema>;
