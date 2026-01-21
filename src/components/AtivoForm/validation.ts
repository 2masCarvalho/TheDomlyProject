import { z } from 'zod';

export const ativoFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  marca: z.string().min(1, 'Marca é obrigatória'),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  num_serie: z.number({ 
    invalid_type_error: 'Nº de série é obrigatório e deve ser um número' 
  }),
  data_instalacao: z.string().min(1, 'Data de instalação é obrigatória'),
  // NOVOS CAMPOS AQUI:
  ultima_manutencao: z.string().optional().or(z.literal('')),
  frequencia_manutencao: z.number({ 
    invalid_type_error: 'Frequência deve ser um número' 
  }).min(1, 'Mínimo 1 mês').default(6),
  
  estado: z.enum(['excelente', 'bom', 'regular', 'mau'], {
    required_error: 'Selecione o estado do ativo',
  }),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.number({ 
    invalid_type_error: 'Valor é obrigatório' 
  }).min(0, 'O valor não pode ser negativo'),
  localizacao: z.string().optional().or(z.literal('')),
});

export type AtivoFormData = z.infer<typeof ativoFormSchema>;