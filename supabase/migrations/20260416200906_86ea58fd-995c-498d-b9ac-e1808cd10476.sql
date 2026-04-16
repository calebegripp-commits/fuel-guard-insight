
-- =========================================================================
-- 1. NORMALIZATION HELPERS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.normalize_plate(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN input IS NULL THEN NULL
    ELSE upper(regexp_replace(input, '[^A-Za-z0-9]', '', 'g'))
  END;
$$;

CREATE OR REPLACE FUNCTION public.extract_plate_from_text(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cleaned text;
  candidate text;
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  cleaned := upper(regexp_replace(input, '[^A-Za-z0-9]', '', 'g'));
  IF length(cleaned) < 7 THEN RETURN NULL; END IF;
  candidate := right(cleaned, 7);
  RETURN candidate;
END;
$$;

-- =========================================================================
-- 2. NORMALIZE EXISTING DATA + TRIGGERS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.normalize_historico_consumo()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.placa := public.normalize_plate(NEW.placa);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_historico_consumo ON public.historico_consumo;
CREATE TRIGGER trg_normalize_historico_consumo
  BEFORE INSERT OR UPDATE ON public.historico_consumo
  FOR EACH ROW EXECUTE FUNCTION public.normalize_historico_consumo();

CREATE OR REPLACE FUNCTION public.normalize_relacao_frota()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.placa := public.normalize_plate(NEW.placa);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_relacao_frota ON public.relacao_frota;
CREATE TRIGGER trg_normalize_relacao_frota
  BEFORE INSERT OR UPDATE ON public.relacao_frota
  FOR EACH ROW EXECUTE FUNCTION public.normalize_relacao_frota();

UPDATE public.historico_consumo SET placa = public.normalize_plate(placa) WHERE placa IS NOT NULL;
UPDATE public.relacao_frota SET placa = public.normalize_plate(placa) WHERE placa IS NOT NULL;
UPDATE public.rastreador_bruto SET placa_extraida = public.normalize_plate(placa_extraida) WHERE placa_extraida IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_historico_consumo_placa ON public.historico_consumo(placa);
CREATE INDEX IF NOT EXISTS idx_historico_consumo_data ON public.historico_consumo(data_hora);
CREATE INDEX IF NOT EXISTS idx_rastreador_bruto_placa ON public.rastreador_bruto(placa_extraida);
CREATE INDEX IF NOT EXISTS idx_rastreador_bruto_data ON public.rastreador_bruto(data_inicial_timestamp);
CREATE INDEX IF NOT EXISTS idx_relacao_frota_placa ON public.relacao_frota(placa);

-- =========================================================================
-- 3. AGGREGATE TABLES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.metricas_veiculo (
  placa text PRIMARY KEY,
  modelo text,
  responsavel_local text,
  total_km_rodado numeric NOT NULL DEFAULT 0,
  total_litros numeric NOT NULL DEFAULT 0,
  total_valor numeric NOT NULL DEFAULT 0,
  km_por_litro numeric,
  custo_por_km numeric,
  num_abastecimentos integer NOT NULL DEFAULT 0,
  primeiro_abastecimento timestamptz,
  ultimo_abastecimento timestamptz,
  desvio_consumo boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.metricas_veiculo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read metricas_veiculo" ON public.metricas_veiculo;
CREATE POLICY "Public read metricas_veiculo" ON public.metricas_veiculo FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.auditoria_consumo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumo_id uuid NOT NULL,
  placa text,
  data_hora timestamptz,
  posto text,
  status text NOT NULL,
  motivo text,
  area_rota_rastreador text,
  diff_minutos integer,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auditoria_consumo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read auditoria_consumo" ON public.auditoria_consumo;
CREATE POLICY "Public read auditoria_consumo" ON public.auditoria_consumo FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_auditoria_consumo_placa ON public.auditoria_consumo(placa);
CREATE INDEX IF NOT EXISTS idx_auditoria_consumo_status ON public.auditoria_consumo(status);
CREATE INDEX IF NOT EXISTS idx_auditoria_consumo_data ON public.auditoria_consumo(data_hora);

CREATE TABLE IF NOT EXISTS public.status_dados_veiculo (
  placa text PRIMARY KEY,
  tem_frota boolean NOT NULL DEFAULT false,
  tem_consumo boolean NOT NULL DEFAULT false,
  tem_rastreador boolean NOT NULL DEFAULT false,
  num_consumo integer NOT NULL DEFAULT 0,
  num_rastreador integer NOT NULL DEFAULT 0,
  completude text NOT NULL DEFAULT 'incompleto',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.status_dados_veiculo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read status_dados_veiculo" ON public.status_dados_veiculo;
CREATE POLICY "Public read status_dados_veiculo" ON public.status_dados_veiculo FOR SELECT USING (true);

-- =========================================================================
-- 4. REFRESH FUNCTION
-- =========================================================================
CREATE OR REPLACE FUNCTION public.refresh_all_metrics()
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Deduplicate frota by placa (keeps latest by created_at)
  DELETE FROM public.metricas_veiculo;

  WITH frota_dedup AS (
    SELECT DISTINCT ON (placa) placa, modelo, responsavel_local
    FROM public.relacao_frota
    WHERE placa IS NOT NULL
    ORDER BY placa, created_at DESC
  ),
  agg AS (
    SELECT
      h.placa,
      COALESCE(SUM(h.km_rodado), 0) AS total_km,
      COALESCE(SUM(h.quantidade_total), 0) AS total_l,
      COALESCE(SUM(h.valor_venda), 0) AS total_v,
      COUNT(*)::int AS n,
      MIN(h.data_hora) AS primeira,
      MAX(h.data_hora) AS ultima
    FROM public.historico_consumo h
    WHERE h.placa IS NOT NULL
    GROUP BY h.placa
  )
  INSERT INTO public.metricas_veiculo (
    placa, modelo, responsavel_local,
    total_km_rodado, total_litros, total_valor,
    km_por_litro, custo_por_km,
    num_abastecimentos, primeiro_abastecimento, ultimo_abastecimento
  )
  SELECT
    a.placa, f.modelo, f.responsavel_local,
    a.total_km, a.total_l, a.total_v,
    CASE WHEN a.total_l > 0 THEN a.total_km / a.total_l ELSE NULL END,
    CASE WHEN a.total_km > 0 THEN a.total_v / a.total_km ELSE NULL END,
    a.n, a.primeira, a.ultima
  FROM agg a
  LEFT JOIN frota_dedup f ON f.placa = a.placa;

  UPDATE public.metricas_veiculo m
  SET desvio_consumo = true
  FROM (
    SELECT modelo, AVG(km_por_litro) AS avg_kml
    FROM public.metricas_veiculo
    WHERE modelo IS NOT NULL AND km_por_litro IS NOT NULL AND km_por_litro > 0
    GROUP BY modelo
    HAVING COUNT(*) >= 2
  ) avg
  WHERE m.modelo = avg.modelo
    AND m.km_por_litro IS NOT NULL
    AND m.km_por_litro < avg.avg_kml * 0.8;

  -- AUDITORIA
  DELETE FROM public.auditoria_consumo;
  INSERT INTO public.auditoria_consumo (
    consumo_id, placa, data_hora, posto, status, motivo, area_rota_rastreador, diff_minutos
  )
  SELECT
    h.id, h.placa, h.data_hora, h.posto,
    CASE
      WHEN best.placa_extraida IS NULL THEN 'NAO_CONFORME'
      WHEN h.posto IS NOT NULL AND best.area_rota IS NOT NULL
           AND lower(best.area_rota) NOT LIKE '%' || lower(h.posto) || '%'
           AND lower(h.posto) NOT LIKE '%' || lower(best.area_rota) || '%'
        THEN 'SUSPEITO'
      ELSE 'CONFORME'
    END,
    CASE
      WHEN best.placa_extraida IS NULL THEN 'Sem registro do rastreador na janela de ±30 min'
      WHEN h.posto IS NOT NULL AND best.area_rota IS NOT NULL
           AND lower(best.area_rota) NOT LIKE '%' || lower(h.posto) || '%'
           AND lower(h.posto) NOT LIKE '%' || lower(best.area_rota) || '%'
        THEN 'Local do rastreador (' || best.area_rota || ') não bate com o posto (' || h.posto || ')'
      ELSE 'Cruzamento OK'
    END,
    best.area_rota, best.diff_min
  FROM public.historico_consumo h
  LEFT JOIN LATERAL (
    SELECT r.placa_extraida, r.area_rota,
      ABS(EXTRACT(EPOCH FROM (r.data_inicial_timestamp - h.data_hora)) / 60)::int AS diff_min
    FROM public.rastreador_bruto r
    WHERE r.placa_extraida = h.placa
      AND r.data_inicial_timestamp IS NOT NULL
      AND ABS(EXTRACT(EPOCH FROM (r.data_inicial_timestamp - h.data_hora))) <= 1800
    ORDER BY ABS(EXTRACT(EPOCH FROM (r.data_inicial_timestamp - h.data_hora))) ASC
    LIMIT 1
  ) best ON true
  WHERE h.placa IS NOT NULL AND h.data_hora IS NOT NULL;

  -- STATUS
  DELETE FROM public.status_dados_veiculo;
  INSERT INTO public.status_dados_veiculo (
    placa, tem_frota, tem_consumo, tem_rastreador, num_consumo, num_rastreador, completude
  )
  SELECT
    p.placa,
    bool_or(p.src = 'frota'),
    bool_or(p.src = 'consumo'),
    bool_or(p.src = 'rastreador'),
    COUNT(*) FILTER (WHERE p.src = 'consumo')::int,
    COUNT(*) FILTER (WHERE p.src = 'rastreador')::int,
    CASE
      WHEN bool_or(p.src='frota') AND bool_or(p.src='consumo') AND bool_or(p.src='rastreador') THEN 'completo'
      WHEN bool_or(p.src='frota') OR bool_or(p.src='consumo') OR bool_or(p.src='rastreador') THEN 'parcial'
      ELSE 'incompleto'
    END
  FROM (
    SELECT placa, 'frota'::text AS src FROM public.relacao_frota WHERE placa IS NOT NULL
    UNION ALL
    SELECT placa, 'consumo' FROM public.historico_consumo WHERE placa IS NOT NULL
    UNION ALL
    SELECT placa_extraida, 'rastreador' FROM public.rastreador_bruto WHERE placa_extraida IS NOT NULL
  ) p
  GROUP BY p.placa;
END;
$$;

-- =========================================================================
-- 5. AUTO-REFRESH TRIGGERS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.trigger_refresh_metrics()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.refresh_all_metrics();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_after_consumo ON public.historico_consumo;
CREATE TRIGGER trg_refresh_after_consumo
  AFTER INSERT OR UPDATE OR DELETE ON public.historico_consumo
  FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_metrics();

DROP TRIGGER IF EXISTS trg_refresh_after_frota ON public.relacao_frota;
CREATE TRIGGER trg_refresh_after_frota
  AFTER INSERT OR UPDATE OR DELETE ON public.relacao_frota
  FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_metrics();

DROP TRIGGER IF EXISTS trg_refresh_after_rastreador ON public.rastreador_bruto;
CREATE TRIGGER trg_refresh_after_rastreador
  AFTER INSERT OR UPDATE OR DELETE ON public.rastreador_bruto
  FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_metrics();

SELECT public.refresh_all_metrics();
