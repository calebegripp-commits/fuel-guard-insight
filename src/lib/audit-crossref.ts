/**
 * Cross-references historico_consumo with rastreador_bruto
 * to classify fueling records as CONFORME / SUSPEITO / NAO_CONFORME
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditCrossStatus = 'CONFORME' | 'SUSPEITO' | 'NAO_CONFORME';

export interface AuditCrossResult {
  id: string;
  data_hora: string;
  placa: string;
  motorista: string | null;
  posto: string | null;
  quantidade_total: number | null;
  valor_venda: number | null;
  km_litro: number | null;
  km_rodado: number | null;
  status: AuditCrossStatus;
  motivo: string;
  rastreador?: {
    id: string;
    area_rota: string | null;
    unidade_rastreada: string;
    placa_extraida: string | null;
    data_inicial_timestamp: string | null;
  } | null;
}

const TOLERANCE_MS = 30 * 60 * 1000; // ±30 minutes

export async function runAuditCrossRef(filters?: {
  placa?: string;
  dataInicio?: string;
  dataFim?: string;
}): Promise<AuditCrossResult[]> {
  // Fetch historico_consumo
  let consumoQuery = supabase.from('historico_consumo').select('*').order('data_hora', { ascending: false });
  if (filters?.placa) consumoQuery = consumoQuery.ilike('placa', `%${filters.placa}%`);
  if (filters?.dataInicio) consumoQuery = consumoQuery.gte('data_hora', filters.dataInicio);
  if (filters?.dataFim) consumoQuery = consumoQuery.lte('data_hora', filters.dataFim);

  const { data: consumoData, error: consumoErr } = await consumoQuery;
  if (consumoErr) throw consumoErr;
  if (!consumoData || consumoData.length === 0) return [];

  // Fetch rastreador_bruto
  const { data: rastreadorData, error: rastreadorErr } = await supabase
    .from('rastreador_bruto')
    .select('*');
  if (rastreadorErr) throw rastreadorErr;

  const rastreadorRecords = rastreadorData || [];

  // Cross-reference
  const results: AuditCrossResult[] = consumoData.map((consumo) => {
    const placaConsumo = (consumo.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const consumoTime = consumo.data_hora ? new Date(consumo.data_hora).getTime() : 0;

    // Find matching rastreador records (same plate, within ±30min)
    const matches = rastreadorRecords.filter((r) => {
      const placaRastr = (r.placa_extraida || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (placaRastr !== placaConsumo || !placaConsumo) return false;
      if (!r.data_inicial_timestamp || !consumoTime) return false;
      const rastrTime = new Date(r.data_inicial_timestamp).getTime();
      return Math.abs(rastrTime - consumoTime) <= TOLERANCE_MS;
    });

    let status: AuditCrossStatus;
    let motivo: string;
    let rastreador: AuditCrossResult['rastreador'] = null;

    if (matches.length === 0) {
      status = 'NAO_CONFORME';
      motivo = 'Sem registro no rastreador para esta placa no período';
    } else {
      rastreador = matches[0];
      const areaRota = (rastreador.area_rota || '').toLowerCase();
      const postoConsumo = (consumo.posto || '').toLowerCase();

      // Check if area/route matches the gas station
      if (postoConsumo && areaRota && areaRota.includes(postoConsumo)) {
        status = 'CONFORME';
        motivo = 'Veículo localizado no rastreador na área correspondente';
      } else if (postoConsumo && areaRota) {
        status = 'SUSPEITO';
        motivo = `Rastreador indica área "${rastreador.area_rota}" — posto informado: "${consumo.posto}"`;
      } else {
        status = 'CONFORME';
        motivo = 'Veículo encontrado no rastreador no mesmo horário';
      }
    }

    return {
      id: consumo.id,
      data_hora: consumo.data_hora || '',
      placa: consumo.placa || '',
      motorista: consumo.motorista,
      posto: consumo.posto,
      quantidade_total: consumo.quantidade_total,
      valor_venda: consumo.valor_venda,
      km_litro: consumo.km_litro,
      km_rodado: consumo.km_rodado,
      status,
      motivo,
      rastreador,
    };
  });

  return results;
}
