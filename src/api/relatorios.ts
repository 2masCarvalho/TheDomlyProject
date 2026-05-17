import { supabase } from '@/supabase-client';

export type RelatorioStatus = 'pending' | 'generating' | 'ready' | 'failed';

export interface RelatorioDataOcorrencias {
  opened: number;
  opened_prev_month: number;
  resolved: number;
  still_open_at_end: number;
  by_categoria: Record<string, number>;
  by_prioridade: Record<string, number>;
  by_estado: Record<string, number>;
  top_recent: Array<{
    id: number;
    titulo: string;
    categoria: string;
    prioridade: string;
    estado: string;
    created_at: string;
  }>;
}

export interface RelatorioDataTrabalhos {
  opened: number;
  concluded: number;
  cancelled: number;
  by_categoria: Record<string, number>;
}

export interface RelatorioDataManutencoes {
  count: number;
  total_cost: number;
  by_tipo: Record<string, number>;
}

export interface RelatorioDataAtivos {
  total: number;
  out_of_compliance: number;
  pending_renovacao: number;
  expiring_next_month: number;
  by_tipo: Record<string, number>;
  expiring_list: Array<{
    id: number;
    nome: string;
    tipo_ativo: string | null;
    data_expiracao: string;
  }>;
}

export interface RelatorioData {
  period: { ano: number; mes: number };
  computed_at: string;
  ocorrencias: RelatorioDataOcorrencias;
  trabalhos: RelatorioDataTrabalhos;
  manutencoes: RelatorioDataManutencoes;
  ativos: RelatorioDataAtivos;
}

export interface RelatorioMensal {
  id_relatorio: string;
  id_condominio: number;
  ano: number;
  mes: number;
  status: RelatorioStatus;
  data_json: RelatorioData;
  summary_md: string | null;
  pdf_storage_path: string | null;
  error_message: string | null;
  generated_at: string;
  generated_by: string | null;
  viewed_at: string | null;
}

export interface RelatorioMensalWithCondo extends RelatorioMensal {
  condominio: { id_comdominio: number; nome: string } | null;
}

export const relatoriosApi = {
  listMine: async (): Promise<RelatorioMensalWithCondo[]> => {
    const { data, error } = await supabase
      .from('relatorios_mensais')
      .select('*, condominios:id_condominio(id_comdominio, nome)')
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
      .order('generated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      ...row,
      condominio: row.condominios ?? null,
    }));
  },

  getById: async (id: string): Promise<RelatorioMensalWithCondo | null> => {
    const { data, error } = await supabase
      .from('relatorios_mensais')
      .select('*, condominios:id_condominio(id_comdominio, nome)')
      .eq('id_relatorio', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, condominio: (data as any).condominios ?? null } as RelatorioMensalWithCondo;
  },

  countUnviewed: async (): Promise<number> => {
    const { count, error } = await supabase
      .from('relatorios_mensais')
      .select('id_relatorio', { count: 'exact', head: true })
      .is('viewed_at', null)
      .eq('status', 'ready');
    if (error) throw error;
    return count ?? 0;
  },

  markViewed: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('relatorios_mensais')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id_relatorio', id)
      .is('viewed_at', null);
    if (error) throw error;
  },

  /**
   * Generate a report on-demand for (condoId, ano, mes). Computes the data
   * snapshot via the SQL function, upserts a pending row, then invokes the
   * Claude Haiku edge function to fill in the executive summary. Returns the
   * final row in `ready` status (or `failed` with an error message).
   */
  generate: async (
    condoId: number,
    ano: number,
    mes: number,
  ): Promise<RelatorioMensalWithCondo> => {
    // 1. Compute fresh data via the SQL function (runs under the user's session).
    const { data: dataJson, error: rpcError } = await supabase.rpc(
      'compute_monthly_report_data',
      { p_condo: condoId, p_ano: ano, p_mes: mes },
    );
    if (rpcError) throw rpcError;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    // 2. Upsert the report row in `pending` with the fresh data snapshot.
    const { data: upserted, error: upsertError } = await supabase
      .from('relatorios_mensais')
      .upsert(
        {
          id_condominio: condoId,
          ano,
          mes,
          status: 'pending',
          data_json: dataJson,
          summary_md: null,
          error_message: null,
          generated_at: new Date().toISOString(),
          generated_by: userId,
          // viewed_at deliberately not reset — if a previous version was viewed, keep it viewed.
        },
        { onConflict: 'id_condominio,ano,mes' },
      )
      .select('id_relatorio')
      .single();
    if (upsertError) throw upsertError;

    // 3. Invoke the edge function for the narrative.
    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      'generate-monthly-report',
      { body: { id_relatorio: upserted.id_relatorio } },
    );
    if (fnError) {
      throw new Error(fnError.message || 'Falha a contactar a função de geração.');
    }
    if (fnData?.error) {
      throw new Error(fnData.error);
    }

    // 4. Refetch the row to return the final state with condominio join.
    const final = await relatoriosApi.getById(upserted.id_relatorio);
    if (!final) throw new Error('Relatório não encontrado após geração.');
    return final;
  },

  /** Retry the AI narrative for a failed/pending report without recomputing data. */
  regenerateNarrative: async (id: string): Promise<RelatorioMensalWithCondo> => {
    await supabase
      .from('relatorios_mensais')
      .update({ status: 'pending', error_message: null })
      .eq('id_relatorio', id);

    const { data: fnData, error: fnError } = await supabase.functions.invoke(
      'generate-monthly-report',
      { body: { id_relatorio: id } },
    );
    if (fnError) throw new Error(fnError.message || 'Falha a contactar a função de geração.');
    if (fnData?.error) throw new Error(fnData.error);

    const final = await relatoriosApi.getById(id);
    if (!final) throw new Error('Relatório não encontrado.');
    return final;
  },

  /** Persist a freshly-generated PDF blob so future downloads can skip regeneration. */
  attachPdfPath: async (id: string, storagePath: string): Promise<void> => {
    const { error } = await supabase
      .from('relatorios_mensais')
      .update({ pdf_storage_path: storagePath })
      .eq('id_relatorio', id);
    if (error) throw error;
  },
};

export function formatPeriodPt(ano: number, mes: number): string {
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${months[mes - 1]} de ${ano}`;
}

export function previousMonth(now: Date = new Date()): { ano: number; mes: number } {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
}
