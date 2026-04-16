CREATE OR REPLACE FUNCTION public.refresh_all_metrics()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
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

  -- STATUS (apenas placas que aparecem em CONSUMO ou RASTREADOR;
  -- frota é apenas referência cruzada, não inclui placas que não abastecem)
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
      WHEN (bool_or(p.src='consumo') OR bool_or(p.src='rastreador')) THEN 'parcial'
      ELSE 'incompleto'
    END
  FROM (
    SELECT placa, 'frota'::text AS src FROM public.relacao_frota WHERE placa IS NOT NULL
    UNION ALL
    SELECT placa, 'consumo' FROM public.historico_consumo WHERE placa IS NOT NULL
    UNION ALL
    SELECT placa_extraida, 'rastreador' FROM public.rastreador_bruto WHERE placa_extraida IS NOT NULL
  ) p
  GROUP BY p.placa
  HAVING bool_or(p.src = 'consumo') OR bool_or(p.src = 'rastreador');

  PERFORM 1;
END;
$function$;

SELECT public.refresh_all_metrics();