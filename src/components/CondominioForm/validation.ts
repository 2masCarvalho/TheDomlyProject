import { z } from "zod";

// 1. O schema que define as regras
export const condominioFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  morada: z.string().min(1, "Morada é obrigatória"),
  codigo_postal: z.string().min(1, "Código postal é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  nif: z.string().length(9, "NIF deve ter 9 caracteres"), // Mantido como string
  n_fracoes: z.coerce.number().int().positive("Número deve ser positivo"),
  contacto_administrador: z.string().min(1, "Contacto é obrigatório"),
});

// 2. A linha que cria e exporta o tipo TypeScript a partir do schema
export type CondominioFormData = z.infer<typeof condominioFormSchema>;