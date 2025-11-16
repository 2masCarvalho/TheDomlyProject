import { z } from 'zod';

export const condominioFormSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  morada: z.string().trim().min(1, 'Morada é obrigatória').max(255, 'Morada deve ter no máximo 255 caracteres'),
  codigo_postal: z.string().trim().min(1, 'Código postal é obrigatório').max(20, 'Código postal deve ter no máximo 20 caracteres'),
  cidade: z.string().trim().min(1, 'Cidade é obrigatória').max(100, 'Cidade deve ter no máximo 100 caracteres'),
  nif: z.number().min(100000000, 'NIF inválido').max(999999999, 'NIF inválido'),
  n_fracoes: z.number().min(1, 'Número de frações deve ser pelo menos 1').optional(),
  contacto_administrador: z.string().trim().max(50, 'Contacto deve ter no máximo 50 caracteres').optional(),
});

export type CondominioFormData = z.infer<typeof condominioFormSchema>;
