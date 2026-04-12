/**
 * Generates alerts from real Supabase data.
 */
import { supabase } from '@/integrations/supabase/client';
import { isValidBrazilianPlate } from './plate-extractor';
import { runAuditCrossRef } from './audit-crossref';

export interface AlertItem {
  id: string;
  type: 'placa_invalida' | 'suspeito' | 'nao_conforme' | 'desvio_consumo' | 'nao_cadastrado';
  severity: 'high' | 'medium' | 'low';
  message: string;
  placa: string;
  data: string;
  detail?: string;
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  const alerts: AlertItem[] = [];

  const [consumoRes, frotaRes, rastreadorRes] = await Promise.all([
    supabase.from('historico_consumo').select('*'),
    supabase.from('relacao_frota').select('placa, modelo'),
    supabase.from('rastreador_bruto').select('id, placa_extraida, unidade_rastreada, data_inicial_timestamp'),
  ]);

  const consumo = consumoRes.data || [];
  const frota = frotaRes.data || [];
  const rastreador = rastreadorRes.data || [];

  // Build sets
  const frotaPlacas = new Set(frota.map((f) => f.placa.toUpperCase().replace(/[^A-Z0-9]/g, '')));

  // 1. Placas inválidas from rastreador_bruto
  rastreador.forEach((r) => {
    const placa = (r.placa_extraida || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (placa && !isValidBrazilianPlate(placa)) {
      alerts.push({
        id: `inv-${r.id}`,
        type: 'placa_invalida',
        severity: 'medium',
        message: `Placa inválida extraída: "${r.placa_extraida}"`,
        placa: placa || r.unidade_rastreada,
        data: r.data_inicial_timestamp || '',
        detail: `Unidade: ${r.unidade_rastreada}`,
      });
    }
  });

  // 2. Audit-based alerts (SUSPEITO / NAO_CONFORME)
  try {
    const auditResults = await runAuditCrossRef();
    auditResults.forEach((r) => {
      if (r.status === 'SUSPEITO') {
        alerts.push({
          id: `sus-${r.id}`,
          type: 'suspeito',
          severity: 'medium',
          message: `Abastecimento suspeito: ${r.motivo}`,
          placa: r.placa,
          data: r.data_hora,
          detail: `Motorista: ${r.motorista || '—'} | Posto: ${r.posto || '—'}`,
        });
      } else if (r.status === 'NAO_CONFORME') {
        alerts.push({
          id: `nc-${r.id}`,
          type: 'nao_conforme',
          severity: 'high',
          message: `Não conforme: ${r.motivo}`,
          placa: r.placa,
          data: r.data_hora,
          detail: `Motorista: ${r.motorista || '—'} | ${r.quantidade_total || 0}L`,
        });
      }
    });
  } catch {
    // no audit data
  }

  // 3. Consumption deviation (20% below model average)
  const byVehicle: Record<string, { km: number; litros: number; modelo: string }> = {};
  const modeloMap: Record<string, string> = {};
  frota.forEach((f) => {
    const p = f.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    modeloMap[p] = f.modelo || 'Desconhecido';
  });

  consumo.forEach((r) => {
    const p = (r.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!p) return;
    if (!byVehicle[p]) byVehicle[p] = { km: 0, litros: 0, modelo: modeloMap[p] || 'Desconhecido' };
    byVehicle[p].km += Number(r.km_rodado) || 0;
    byVehicle[p].litros += Number(r.quantidade_total) || 0;
  });

  // Calc model averages
  const modeloStats: Record<string, { km: number; litros: number }> = {};
  Object.values(byVehicle).forEach((v) => {
    if (!modeloStats[v.modelo]) modeloStats[v.modelo] = { km: 0, litros: 0 };
    modeloStats[v.modelo].km += v.km;
    modeloStats[v.modelo].litros += v.litros;
  });

  Object.entries(byVehicle).forEach(([placa, v]) => {
    if (v.litros === 0) return;
    const kml = v.km / v.litros;
    const ms = modeloStats[v.modelo];
    if (!ms || ms.litros === 0) return;
    const avgKml = ms.km / ms.litros;
    if (avgKml > 0 && kml < avgKml * 0.8) {
      alerts.push({
        id: `dev-${placa}`,
        type: 'desvio_consumo',
        severity: 'high',
        message: `Consumo ${Math.round((1 - kml / avgKml) * 100)}% abaixo da média do modelo ${v.modelo}`,
        placa,
        data: '',
        detail: `${kml.toFixed(2)} km/L vs média ${avgKml.toFixed(2)} km/L`,
      });
    }
  });

  // 4. Veículo não cadastrado
  const consumoPlacas = new Set(consumo.map((r) => (r.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(Boolean));
  consumoPlacas.forEach((p) => {
    if (!frotaPlacas.has(p)) {
      alerts.push({
        id: `nc-reg-${p}`,
        type: 'nao_cadastrado',
        severity: 'low',
        message: `Placa ${p} não cadastrada na relação de frota`,
        placa: p,
        data: '',
      });
    }
  });

  // Sort: high > medium > low
  const severityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}
