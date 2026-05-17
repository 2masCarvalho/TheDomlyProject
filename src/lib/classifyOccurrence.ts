import { supabase } from '@/supabase-client';

export type ClassifyResult = {
  categoria: string;
  prioridade: string;
};

async function classifyOccurrence(occurrenceName: string): Promise<ClassifyResult> {
  const { data, error } = await supabase.functions.invoke('classify-occurrence', {
    body: { titulo: occurrenceName },
  });

  if (error) throw new Error(`classify-occurrence failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  if (!data?.result) throw new Error('A IA não devolveu uma classificação válida.');

  return data.result as ClassifyResult;
}

export default classifyOccurrence;
