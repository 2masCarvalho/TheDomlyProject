import { z } from 'zod';

export const ativoFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  num_serie: z.number().optional(),
  data_instalacao: z.string().optional(),
  estado: z.enum(['excelente', 'bom', 'regular', 'mau']).optional(),
  descricao: z.string().optional(),
  valor: z.number().optional(),
  localizacao: z.string().optional(),
});

export type AtivoFormData = z.infer<typeof ativoFormSchema>;
