/**
 * Fuel audit engine - cross-references fueling data with tracker data
 */

export interface FuelingRecord {
  id: string;
  placa: string;
  data: Date;
  litros: number;
  valor: number;
  km: number;
  motorista: string;
  posto: string;
  contrato: string;
  lat?: number;
  lng?: number;
}

export interface TrackerRecord {
  id: string;
  placa: string;
  data: Date;
  km: number;
  lat?: number;
  lng?: number;
}

export interface FleetVehicle {
  placa: string;
  modelo: string;
  ano: number;
  consumo_referencia: number; // km/l reference
  contrato: string;
}

export type AuditStatus = 'CONFORME' | 'NAO_CONFORME' | 'SUSPEITO';

export interface AuditResult {
  fueling: FuelingRecord;
  status: AuditStatus;
  reasons: string[];
  trackerMatch?: TrackerRecord;
  consumo_kml?: number;
  valor_por_km?: number;
  desvio_media?: number;
}

export interface Alert {
  id: string;
  type: 'consumo_alto' | 'sem_rastreador' | 'dados_inconsistentes' | 'placa_invalida';
  severity: 'high' | 'medium' | 'low';
  message: string;
  placa: string;
  data: Date;
}

const TIME_TOLERANCE_MS = 30 * 60 * 1000; // 30 minutes

export function auditFueling(
  fueling: FuelingRecord,
  trackerRecords: TrackerRecord[],
  avgConsumption: number
): AuditResult {
  const reasons: string[] = [];
  let status: AuditStatus = 'CONFORME';
  let trackerMatch: TrackerRecord | undefined;

  // Find tracker record within tolerance
  const matches = trackerRecords.filter(
    (t) =>
      t.placa === fueling.placa &&
      Math.abs(t.data.getTime() - fueling.data.getTime()) <= TIME_TOLERANCE_MS
  );

  if (matches.length === 0) {
    reasons.push('Sem registro no rastreador no horário do abastecimento');
    status = 'NAO_CONFORME';
  } else {
    trackerMatch = matches[0];
  }

  // Calculate consumption if we have km data
  let consumo_kml: number | undefined;
  let valor_por_km: number | undefined;
  let desvio_media: number | undefined;

  if (fueling.km > 0 && fueling.litros > 0) {
    consumo_kml = fueling.km / fueling.litros;
    valor_por_km = fueling.valor / fueling.km;

    if (avgConsumption > 0) {
      desvio_media = ((consumo_kml - avgConsumption) / avgConsumption) * 100;

      if (Math.abs(desvio_media) > 30) {
        reasons.push(`Consumo ${desvio_media > 0 ? 'acima' : 'abaixo'} de 30% da média`);
        status = status === 'NAO_CONFORME' ? 'NAO_CONFORME' : 'SUSPEITO';
      }
    }
  }

  if (fueling.litros <= 0 || fueling.valor <= 0) {
    reasons.push('Dados de litros ou valor inválidos');
    status = 'NAO_CONFORME';
  }

  if (reasons.length === 0) {
    reasons.push('Todos os critérios atendidos');
  }

  return { fueling, status, reasons, trackerMatch, consumo_kml, valor_por_km, desvio_media };
}

export function detectAnomalies(values: number[]): { mean: number; stdDev: number; outlierIndices: number[] } {
  if (values.length === 0) return { mean: 0, stdDev: 0, outlierIndices: [] };

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const outlierIndices = values
    .map((v, i) => (Math.abs(v - mean) > 2 * stdDev ? i : -1))
    .filter((i) => i >= 0);

  return { mean, stdDev, outlierIndices };
}
