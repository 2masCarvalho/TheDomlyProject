import { supabase } from '@/supabase-client';

export type DocumentTemplate = {
  id: string;
  nome: string;
  descricao?: string | null;
  template_type: string;
  body: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateDocumentTemplate = Pick<DocumentTemplate, 'nome' | 'descricao' | 'template_type' | 'body'>;

export const documentTemplatesApi = {
  list: async (): Promise<DocumentTemplate[]> => {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DocumentTemplate[];
  },

  create: async (payload: CreateDocumentTemplate): Promise<DocumentTemplate> => {
    const { data, error } = await supabase.from('document_templates').insert([payload]).select().single();
    if (error) throw error;
    return data as DocumentTemplate;
  },

  update: async (id: string, payload: Partial<CreateDocumentTemplate>): Promise<DocumentTemplate> => {
    const { data, error } = await supabase
      .from('document_templates')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as DocumentTemplate;
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from('document_templates').delete().eq('id', id);
    if (error) throw error;
  },
};

