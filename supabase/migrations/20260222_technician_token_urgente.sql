-- Add technician token and urgency flag to work orders
ALTER TABLE trabalhos_manutencao
  ADD COLUMN IF NOT EXISTS token_tecnico UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS is_urgente BOOLEAN DEFAULT false;

-- Backfill existing rows
UPDATE trabalhos_manutencao
SET token_tecnico = gen_random_uuid()
WHERE token_tecnico IS NULL;

-- RPC: get public job data by token (used by technician public page, no auth needed)
CREATE OR REPLACE FUNCTION get_trabalho_por_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id_trabalho',  t.id_trabalho,
    'titulo',       t.titulo,
    'descricao',    t.descricao,
    'categoria',    t.categoria,
    'urgencia',     t.urgencia,
    'estado',       t.estado,
    'is_urgente',   t.is_urgente,
    'token_tecnico',t.token_tecnico,
    'created_at',   t.created_at,
    'condominio_nome', c.nome
  )
  INTO v_result
  FROM trabalhos_manutencao t
  LEFT JOIN condominios c ON c.id_comdominio = t.id_condominio
  WHERE t.token_tecnico = p_token;

  RETURN v_result;
END;
$$;

-- RPC: technician responds to a job via token (accept or cancel)
CREATE OR REPLACE FUNCTION responder_trabalho_por_token(p_token UUID, p_aceitar BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id INTEGER;
  v_result JSON;
BEGIN
  SELECT id_trabalho INTO v_id
  FROM trabalhos_manutencao
  WHERE token_tecnico = p_token;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Trabalho não encontrado';
  END IF;

  IF p_aceitar THEN
    UPDATE trabalhos_manutencao
    SET estado = 'atribuido',
        updated_at = now()
    WHERE id_trabalho = v_id;
  ELSE
    -- Cancel: flip back to open, remove technician, mark as urgent
    UPDATE trabalhos_manutencao
    SET estado               = 'aberto',
        id_tecnico_atribuido = NULL,
        is_urgente           = true,
        updated_at           = now()
    WHERE id_trabalho = v_id;
  END IF;

  SELECT json_build_object(
    'id_trabalho', id_trabalho,
    'estado',      estado,
    'is_urgente',  is_urgente
  )
  INTO v_result
  FROM trabalhos_manutencao
  WHERE id_trabalho = v_id;

  RETURN v_result;
END;
$$;

-- Grant anonymous users access to these RPCs (for technician public page)
GRANT EXECUTE ON FUNCTION get_trabalho_por_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION responder_trabalho_por_token(UUID, BOOLEAN) TO anon;
