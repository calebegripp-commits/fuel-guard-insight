/**
 * Fetches real data from Supabase for the dashboard.
 */
import { supabase } from '@/integrations/supabase/client';
import { runAuditCrossRef, type AuditCrossResult } from '@/lib/audit-crossref';

export interface DashboardFilters {
  placa?: string;
  contrato?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface DashboardMetrics {
  totalAbastecimentos: number;
  totalLitros: number;
  totalValor: number;
  totalKm: number;
  mediaKml: number;
  valorPorKm: number;
  conformidade: number;
  conforme: number;
  suspeito: number;
  naoConforme: number;
}

export interface MonthlyPoint {
  month: string;
  litros: number;
  valor: number;
  km: number;
  mediaKml: number;
  abastecimentos: number;
}

export interface VehicleRank {
  placa: string;
  modelo: string;
  mediaKml: number;
  totalLitros: number;
  totalValor: number;
  totalKm: number;
  abastecimentos: number;
  anomalia: boolean; // 20% above model average
}

interface ConsumoRow {
  id: string;
  data_hora: string | null;
  placa: string | null;
  motorista: string | null;
  km_anterior: number | null;
  km_rodado: number | null;
  km_litro: number | null;
  quantidade_total: number | null;
  preco_unitario: number | null;
  valor_venda: number | null;
  produto: string | null;
  posto: string | null;
}

interface FrotaRow {
  placa: string;
  modelo: string | null;
  responsavel_local: string | null;
}

export async function fetchDashboardData(filters: DashboardFilters = {}) {
  // Fetch historico_consumo with filters
  let query = supabase.from('historico_consumo').select('*');
  if (filters.placa) query = query.ilike('placa', `%${filters.placa}%`);
  if (filters.dataInicio) query = query.gte('data_hora', filters.dataInicio);
  if (filters.dataFim) query = query.lte('data_hora', filters.dataFim);

  const [consumoRes, frotaRes] = await Promise.all([
    query,
    supabase.from('relacao_frota').select('placa, modelo, responsavel_local'),
  ]);

  if (consumoRes.error) throw consumoRes.error;
  if (frotaRes.error) throw frotaRes.error;

  const consumo: ConsumoRow[] = consumoRes.data || [];
  const frota: FrotaRow[] = frotaRes.data || [];

  // Build modelo map from relacao_frota
  const modeloMap: Record<string, string> = {};
  frota.forEach((f) => {
    const p = (f.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (p) modeloMap[p] = f.modelo || 'Desconhecido';
  });

  // If contrato filter, we'd need veiculos table. For now filter by placa in frota.
  let filtered = consumo;
  if (filters.contrato) {
    // No contrato in historico_consumo, skip or filter via veiculos later
  }

  // --- Metrics ---
  let totalLitros = 0, totalValor = 0, totalKm = 0;
  filtered.forEach((r) => {
    totalLitros += Number(r.quantidade_total) || 0;
    totalValor += Number(r.valor_venda) || 0;
    totalKm += Number(r.km_rodado) || 0;
  });

  const mediaKml = totalLitros > 0 ? totalKm / totalLitros : 0;
  const valorPorKm = totalKm > 0 ? totalValor / totalKm : 0;

  // --- Monthly data ---
  const months: Record<string, { litros: number; valor: number; km: number; count: number }> = {};
  filtered.forEach((r) => {
    if (!r.data_hora) return;
    const d = new Date(r.data_hora);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!months[key]) months[key] = { litros: 0, valor: 0, km: 0, count: 0 };
    months[key].litros += Number(r.quantidade_total) || 0;
    months[key].valor += Number(r.valor_venda) || 0;
    months[key].km += Number(r.km_rodado) || 0;
    months[key].count += 1;
  });

  const monthly: MonthlyPoint[] = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      litros: Math.round(d.litros),
      valor: Math.round(d.valor),
      km: Math.round(d.km),
      mediaKml: d.litros > 0 ? Math.round((d.km / d.litros) * 100) / 100 : 0,
      abastecimentos: d.count,
    }));

  // --- Vehicle ranking ---
  const byVehicle: Record<string, { litros: number; km: number; valor: number; count: number }> = {};
  filtered.forEach((r) => {
    const p = (r.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!p) return;
    if (!byVehicle[p]) byVehicle[p] = { litros: 0, km: 0, valor: 0, count: 0 };
    byVehicle[p].litros += Number(r.quantidade_total) || 0;
    byVehicle[p].km += Number(r.km_rodado) || 0;
    byVehicle[p].valor += Number(r.valor_venda) || 0;
    byVehicle[p].count += 1;
  });

  // Average km/L per modelo (for anomaly detection)
  const modeloStats: Record<string, { totalKm: number; totalLitros: number }> = {};
  Object.entries(byVehicle).forEach(([placa, d]) => {
    const modelo = modeloMap[placa] || 'Desconhecido';
    if (!modeloStats[modelo]) modeloStats[modelo] = { totalKm: 0, totalLitros: 0 };
    modeloStats[modelo].totalKm += d.km;
    modeloStats[modelo].totalLitros += d.litros;
  });

  const modeloAvgKml: Record<string, number> = {};
  Object.entries(modeloStats).forEach(([modelo, s]) => {
    modeloAvgKml[modelo] = s.totalLitros > 0 ? s.totalKm / s.totalLitros : 0;
  });

  const vehicleRanking: VehicleRank[] = Object.entries(byVehicle)
    .map(([placa, d]) => {
      const modelo = modeloMap[placa] || 'Desconhecido';
      const kml = d.litros > 0 ? d.km / d.litros : 0;
      const avgKml = modeloAvgKml[modelo] || 0;
      // Anomaly: consumption 20% worse (i.e. km/L 20% below model average)
      const anomalia = avgKml > 0 && kml < avgKml * 0.8;
      return {
        placa,
        modelo,
        mediaKml: Math.round(kml * 100) / 100,
        totalLitros: Math.round(d.litros),
        totalValor: Math.round(d.valor),
        totalKm: Math.round(d.km),
        abastecimentos: d.count,
        anomalia,
      };
    })
    .sort((a, b) => a.mediaKml - b.mediaKml); // worst first

  // --- Audit ---
  let auditResults: AuditCrossResult[] = [];
  try {
    auditResults = await runAuditCrossRef({
      placa: filters.placa || undefined,
      dataInicio: filters.dataInicio || undefined,
      dataFim: filters.dataFim || undefined,
    });
  } catch {
    // audit may fail if no data
  }

  const conforme = auditResults.filter((r) => r.status === 'CONFORME').length;
  const suspeito = auditResults.filter((r) => r.status === 'SUSPEITO').length;
  const naoConforme = auditResults.filter((r) => r.status === 'NAO_CONFORME').length;
  const conformidade = auditResults.length > 0 ? Math.round((conforme / auditResults.length) * 100) : 0;

  const metrics: DashboardMetrics = {
    totalAbastecimentos: filtered.length,
    totalLitros: Math.round(totalLitros),
    totalValor: Math.round(totalValor * 100) / 100,
    totalKm: Math.round(totalKm),
    mediaKml: Math.round(mediaKml * 100) / 100,
    valorPorKm: Math.round(valorPorKm * 100) / 100,
    conformidade,
    conforme,
    suspeito,
    naoConforme,
  };

  return { metrics, monthly, vehicleRanking, auditResults };
}
