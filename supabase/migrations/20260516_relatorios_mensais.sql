-- ─────────────────────────────────────────────────────────────────────────────
-- Relatórios mensais — per-condomínio operational summary
--
-- Adds a table + aggregation function + monthly cron job that, on the 1st of
-- every month, snapshots the previous month's activity for each active
-- condomínio into `relatorios_mensais`. The Claude Haiku executive summary
-- is filled in lazily by an Edge Function the first time the gestor opens
-- the report (keeps the cron path zero-dependency — no pg_net / vault).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relatorios_mensais (
  id_relatorio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_condominio BIGINT NOT NULL REFERENCES condominios(id_comdominio) ON DELETE CASCADE,
  ano SMALLINT NOT NULL,
  mes SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary_md TEXT,
  pdf_storage_path TEXT,
  error_message TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ,
  CONSTRAINT relatorios_unique_period UNIQUE (id_condominio, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_relatorios_condominio_period
  ON relatorios_mensais (id_condominio, ano DESC, mes DESC);

CREATE INDEX IF NOT EXISTS idx_relatorios_unviewed
  ON relatorios_mensais (id_condominio) WHERE viewed_at IS NULL;

-- 2. RLS ─────────────────────────────────────────────────────────────────────
-- Only the condomínio owner sees their reports.

ALTER TABLE relatorios_mensais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "relatorios_select_owner" ON relatorios_mensais;
CREATE POLICY "relatorios_select_owner" ON relatorios_mensais FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = relatorios_mensais.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "relatorios_insert_owner" ON relatorios_mensais;
CREATE POLICY "relatorios_insert_owner" ON relatorios_mensais FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "relatorios_update_owner" ON relatorios_mensais;
CREATE POLICY "relatorios_update_owner" ON relatorios_mensais FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = relatorios_mensais.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "relatorios_delete_owner" ON relatorios_mensais;
CREATE POLICY "relatorios_delete_owner" ON relatorios_mensais FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM condominios c
      WHERE c.id_comdominio = relatorios_mensais.id_condominio
        AND c.id_user::text = auth.uid()::text
    )
  );

-- 3. Aggregation function ────────────────────────────────────────────────────
-- Returns a JSONB blob with all KPIs / breakdowns for one (condominio, ano, mes).
-- SECURITY DEFINER so it can read across condomínios from inside the cron job.
-- Callers are checked at the policy boundary (or are the cron job itself).

CREATE OR REPLACE FUNCTION public.compute_monthly_report_data(
  p_condo BIGINT,
  p_ano INT,
  p_mes INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_period_start TIMESTAMPTZ := make_timestamptz(p_ano, p_mes, 1, 0, 0, 0);
  v_period_end TIMESTAMPTZ := v_period_start + INTERVAL '1 month';
  v_prev_start TIMESTAMPTZ := v_period_start - INTERVAL '1 month';
  v_next_start TIMESTAMPTZ := v_period_end;
  v_next_end TIMESTAMPTZ := v_period_end + INTERVAL '1 month';
  v_today DATE := CURRENT_DATE;
  v_result JSONB;
  v_ocorrencias JSONB;
  v_trabalhos JSONB;
  v_manutencoes JSONB;
  v_ativos JSONB;
BEGIN
  -- Ocorrências aggregated for this month
  SELECT jsonb_build_object(
    'opened', COUNT(*) FILTER (WHERE created_at >= v_period_start AND created_at < v_period_end),
    'opened_prev_month', COUNT(*) FILTER (WHERE created_at >= v_prev_start AND created_at < v_period_start),
    'resolved', COUNT(*) FILTER (WHERE resolved_at IS NOT NULL AND resolved_at >= v_period_start AND resolved_at < v_period_end),
    'still_open_at_end', COUNT(*) FILTER (
      WHERE created_at < v_period_end
        AND (resolved_at IS NULL OR resolved_at >= v_period_end)
        AND estado NOT IN ('fechada')
    ),
    'by_categoria', COALESCE((
      SELECT jsonb_object_agg(categoria, n)
      FROM (
        SELECT categoria, COUNT(*) AS n
        FROM ocorrencias
        WHERE id_condominio = p_condo
          AND created_at >= v_period_start
          AND created_at < v_period_end
        GROUP BY categoria
      ) s
    ), '{}'::jsonb),
    'by_prioridade', COALESCE((
      SELECT jsonb_object_agg(prioridade, n)
      FROM (
        SELECT prioridade, COUNT(*) AS n
        FROM ocorrencias
        WHERE id_condominio = p_condo
          AND created_at >= v_period_start
          AND created_at < v_period_end
        GROUP BY prioridade
      ) s
    ), '{}'::jsonb),
    'by_estado', COALESCE((
      SELECT jsonb_object_agg(estado, n)
      FROM (
        SELECT estado, COUNT(*) AS n
        FROM ocorrencias
        WHERE id_condominio = p_condo
          AND created_at >= v_period_start
          AND created_at < v_period_end
        GROUP BY estado
      ) s
    ), '{}'::jsonb),
    'top_recent', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id_ocorrencia,
        'titulo', titulo,
        'categoria', categoria,
        'prioridade', prioridade,
        'estado', estado,
        'created_at', created_at
      ) ORDER BY created_at DESC)
      FROM (
        SELECT id_ocorrencia, titulo, categoria, prioridade, estado, created_at
        FROM ocorrencias
        WHERE id_condominio = p_condo
          AND created_at >= v_period_start
          AND created_at < v_period_end
        ORDER BY created_at DESC
        LIMIT 5
      ) s
    ), '[]'::jsonb)
  ) INTO v_ocorrencias
  FROM ocorrencias
  WHERE id_condominio = p_condo;

  -- Trabalhos de manutenção aggregated for this month
  SELECT jsonb_build_object(
    'opened', COUNT(*) FILTER (WHERE created_at >= v_period_start AND created_at < v_period_end),
    'concluded', COUNT(*) FILTER (
      WHERE completed_at IS NOT NULL
        AND completed_at >= v_period_start
        AND completed_at < v_period_end
        AND estado = 'concluido'
    ),
    'cancelled', COUNT(*) FILTER (
      WHERE estado = 'cancelado'
        AND updated_at >= v_period_start
        AND updated_at < v_period_end
    ),
    'by_categoria', COALESCE((
      SELECT jsonb_object_agg(categoria, n)
      FROM (
        SELECT categoria, COUNT(*) AS n
        FROM trabalhos_manutencao
        WHERE id_condominio = p_condo
          AND (
            (created_at >= v_period_start AND created_at < v_period_end)
            OR (completed_at >= v_period_start AND completed_at < v_period_end)
          )
        GROUP BY categoria
      ) s
    ), '{}'::jsonb)
  ) INTO v_trabalhos
  FROM trabalhos_manutencao
  WHERE id_condominio = p_condo;

  -- Manutenções (records of work done on assets). The `manutencoes` table is
  -- created via the Supabase dashboard (no migration), so guard with to_regclass.
  IF to_regclass('public.manutencoes') IS NOT NULL THEN
    EXECUTE $manutencoes$
      SELECT jsonb_build_object(
        'count', COALESCE(SUM(n), 0),
        'total_cost', COALESCE(SUM(total_cost), 0),
        'by_tipo', COALESCE(jsonb_object_agg(tipo_manutencao, n) FILTER (WHERE tipo_manutencao IS NOT NULL), '{}'::jsonb)
      )
      FROM (
        SELECT
          mn.tipo_manutencao,
          COUNT(*) AS n,
          COALESCE(SUM(mn.custo), 0)::numeric AS total_cost
        FROM manutencoes mn
        JOIN ativos a ON a.id_ativo = mn.id_ativo
        WHERE a.id_condominio = $1
          AND mn.data_conclusao >= $2::date
          AND mn.data_conclusao < $3::date
        GROUP BY mn.tipo_manutencao
      ) m
    $manutencoes$
    USING p_condo, v_period_start::date, v_period_end::date
    INTO v_manutencoes;

    -- Empty result (no rows) yields NULL from the outer aggregate; normalise to zeros.
    IF v_manutencoes IS NULL OR v_manutencoes->>'count' IS NULL THEN
      v_manutencoes := jsonb_build_object('count', 0, 'total_cost', 0, 'by_tipo', '{}'::jsonb);
    END IF;
  ELSE
    v_manutencoes := jsonb_build_object('count', 0, 'total_cost', 0, 'by_tipo', '{}'::jsonb);
  END IF;

  -- Ativos — compliance snapshot at end of period + things expiring soon
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'out_of_compliance', COUNT(*) FILTER (WHERE estado_licenca = 'expirado'),
    'pending_renovacao', COUNT(*) FILTER (WHERE estado_licenca = 'pendente_renovacao'),
    'expiring_next_month', COUNT(*) FILTER (
      WHERE data_expiracao IS NOT NULL
        AND data_expiracao >= v_next_start::date
        AND data_expiracao < v_next_end::date
    ),
    'by_tipo', COALESCE((
      SELECT jsonb_object_agg(tipo_ativo, n)
      FROM (
        SELECT tipo_ativo, COUNT(*) AS n
        FROM ativos
        WHERE id_condominio = p_condo AND tipo_ativo IS NOT NULL
        GROUP BY tipo_ativo
      ) s
    ), '{}'::jsonb),
    'expiring_list', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id_ativo,
        'nome', nome,
        'tipo_ativo', tipo_ativo,
        'data_expiracao', data_expiracao
      ) ORDER BY data_expiracao ASC)
      FROM (
        SELECT id_ativo, nome, tipo_ativo, data_expiracao
        FROM ativos
        WHERE id_condominio = p_condo
          AND data_expiracao IS NOT NULL
          AND data_expiracao >= v_today
          AND data_expiracao < (v_today + INTERVAL '60 days')::date
        ORDER BY data_expiracao ASC
        LIMIT 10
      ) s
    ), '[]'::jsonb)
  ) INTO v_ativos
  FROM ativos
  WHERE id_condominio = p_condo;

  v_result := jsonb_build_object(
    'period', jsonb_build_object('ano', p_ano, 'mes', p_mes),
    'computed_at', now(),
    'ocorrencias', v_ocorrencias,
    'trabalhos', v_trabalhos,
    'manutencoes', v_manutencoes,
    'ativos', v_ativos
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.compute_monthly_report_data(BIGINT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_monthly_report_data(BIGINT, INT, INT) TO authenticated;

-- 4. Cron entry — snapshot previous month for every active condomínio ────────

CREATE OR REPLACE FUNCTION public.enqueue_monthly_reports()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_year INT := EXTRACT(YEAR FROM (now() - INTERVAL '1 month'))::int;
  v_target_month INT := EXTRACT(MONTH FROM (now() - INTERVAL '1 month'))::int;
  v_count INT := 0;
  r RECORD;
BEGIN
  FOR r IN SELECT id_comdominio FROM condominios WHERE COALESCE(is_active, true) LOOP
    INSERT INTO relatorios_mensais (id_condominio, ano, mes, status, data_json)
    VALUES (
      r.id_comdominio,
      v_target_year,
      v_target_month,
      'pending',
      public.compute_monthly_report_data(r.id_comdominio, v_target_year, v_target_month)
    )
    ON CONFLICT (id_condominio, ano, mes) DO UPDATE
      SET data_json = EXCLUDED.data_json,
          status = CASE
            WHEN relatorios_mensais.status = 'ready' THEN 'ready'
            ELSE 'pending'
          END,
          generated_at = now();
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_monthly_reports() FROM PUBLIC;
-- Don't grant to authenticated — only the cron worker (postgres role) and
-- direct SQL admin invocation should call this.

-- 5. Schedule: 02:00 UTC on day 1 of every month ─────────────────────────────
-- Idempotent: drop any existing schedule with this name first, then re-create.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-reports-generation') THEN
    PERFORM cron.unschedule('monthly-reports-generation');
  END IF;
END $$;

SELECT cron.schedule(
  'monthly-reports-generation',
  '0 2 1 * *',
  $cron$SELECT public.enqueue_monthly_reports();$cron$
);
