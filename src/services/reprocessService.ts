/**
 * Reprocess service — dispara recálculo no banco e lê métricas agregadas.
 * O recálculo principal acontece via triggers PostgreSQL após cada insert,
 * mas esta função permite forçar manualmente.
 */
import { supabase } from '@/integrations/supabase/client';

export async function refreshMetrics(): Promise<{ ok: boolean; error?: string }> {
  // Triggers já recalculam automaticamente. Mantemos esta função como no-op
  // que faz uma leitura para confirmar conectividade.
  const { error } = await supabase.from('metricas_veiculo').select('placa', { count: 'exact', head: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface MetricaVeiculo {
  placa: string;
  modelo: string | null;
  responsavel_local: string | null;
  total_km_rodado: number;
  total_litros: number;
  total_valor: number;
  km_por_litro: number | null;
  custo_por_km: number | null;
  num_abastecimentos: number;
  primeiro_abastecimento: string | null;
  ultimo_abastecimento: string | null;
  desvio_consumo: boolean;
}

export async function getMetricasVeiculo(placa?: string): Promise<MetricaVeiculo[]> {
  let q = supabase.from('metricas_veiculo').select('*').order('total_valor', { ascending: false });
  if (placa) q = q.eq('placa', placa);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MetricaVeiculo[];
}

export interface StatusDadosVeiculo {
  placa: string;
  tem_frota: boolean;
  tem_consumo: boolean;
  tem_rastreador: boolean;
  num_consumo: number;
  num_rastreador: number;
  completude: 'completo' | 'parcial' | 'incompleto';
}

export async function getStatusDados(): Promise<StatusDadosVeiculo[]> {
  const { data, error } = await supabase
    .from('status_dados_veiculo')
    .select('*')
    .order('completude', { ascending: true })
    .order('placa', { ascending: true });
  if (error) throw error;
  return (data ?? []) as StatusDadosVeiculo[];
}

export interface AuditoriaConsumoRow {
  id: string;
  consumo_id: string;
  placa: string | null;
  data_hora: string | null;
  posto: string | null;
  status: 'CONFORME' | 'SUSPEITO' | 'NAO_CONFORME';
  motivo: string | null;
  area_rota_rastreador: string | null;
  diff_minutos: number | null;
}

export async function getAuditoria(filters?: {
  placa?: string;
  status?: string;
  from?: string;
  to?: string;
}): Promise<AuditoriaConsumoRow[]> {
  let q = supabase.from('auditoria_consumo').select('*').order('data_hora', { ascending: false }).limit(1000);
  if (filters?.placa) q = q.ilike('placa', `%${filters.placa}%`);
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.from) q = q.gte('data_hora', filters.from);
  if (filters?.to) q = q.lte('data_hora', filters.to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AuditoriaConsumoRow[];
}
