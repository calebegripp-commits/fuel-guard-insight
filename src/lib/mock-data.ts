import type { FuelingRecord, AuditResult, Alert, FleetVehicle } from './audit-engine';

const vehicles: FleetVehicle[] = [
  { placa: 'ABC1D23', modelo: 'BYD Song Plus', ano: 2024, consumo_referencia: 12.5, contrato: 'CT-001' },
  { placa: 'DEF2G34', modelo: 'Toyota Corolla', ano: 2023, consumo_referencia: 14.2, contrato: 'CT-001' },
  { placa: 'GHI3H45', modelo: 'Fiat Strada', ano: 2022, consumo_referencia: 10.8, contrato: 'CT-002' },
  { placa: 'JKL4I56', modelo: 'VW Saveiro', ano: 2023, consumo_referencia: 11.5, contrato: 'CT-002' },
  { placa: 'MNO5J67', modelo: 'Chevrolet S10', ano: 2024, consumo_referencia: 8.5, contrato: 'CT-003' },
  { placa: 'PQR6K78', modelo: 'Hyundai HB20', ano: 2023, consumo_referencia: 13.8, contrato: 'CT-003' },
  { placa: 'STU7L89', modelo: 'Renault Kwid', ano: 2022, consumo_referencia: 14.5, contrato: 'CT-001' },
  { placa: 'VWX8M90', modelo: 'Honda Civic', ano: 2024, consumo_referencia: 13.0, contrato: 'CT-002' },
];

const motoristas = ['Carlos Silva', 'João Santos', 'Maria Oliveira', 'Pedro Costa', 'Ana Souza', 'Lucas Lima'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateFuelings(): FuelingRecord[] {
  const records: FuelingRecord[] = [];
  const start = new Date('2024-10-01');
  const end = new Date('2025-03-31');

  for (let i = 0; i < 200; i++) {
    const v = vehicles[Math.floor(Math.random() * vehicles.length)];
    const litros = 20 + Math.random() * 40;
    const km = litros * (v.consumo_referencia * (0.7 + Math.random() * 0.6));
    records.push({
      id: `F-${i.toString().padStart(4, '0')}`,
      placa: v.placa,
      data: randomDate(start, end),
      litros: Math.round(litros * 100) / 100,
      valor: Math.round(litros * (5.5 + Math.random() * 1.5) * 100) / 100,
      km: Math.round(km * 10) / 10,
      motorista: motoristas[Math.floor(Math.random() * motoristas.length)],
      posto: `Posto ${Math.floor(Math.random() * 5) + 1}`,
      contrato: v.contrato,
    });
  }
  return records.sort((a, b) => a.data.getTime() - b.data.getTime());
}

export const mockFuelings = generateFuelings();
export const mockVehicles = vehicles;

export function generateAuditResults(): AuditResult[] {
  return mockFuelings.map((f) => {
    const v = vehicles.find((v) => v.placa === f.placa)!;
    const consumo = f.km / f.litros;
    const desvio = ((consumo - v.consumo_referencia) / v.consumo_referencia) * 100;
    const rand = Math.random();

    let status: AuditResult['status'];
    const reasons: string[] = [];

    if (rand < 0.7) {
      status = 'CONFORME';
      reasons.push('Todos os critérios atendidos');
    } else if (rand < 0.88) {
      status = 'SUSPEITO';
      reasons.push('Consumo fora da média esperada');
    } else {
      status = 'NAO_CONFORME';
      reasons.push('Sem registro no rastreador');
    }

    return {
      fueling: f,
      status,
      reasons,
      consumo_kml: Math.round(consumo * 100) / 100,
      valor_por_km: Math.round((f.valor / f.km) * 100) / 100,
      desvio_media: Math.round(desvio * 10) / 10,
    };
  });
}

export const mockAuditResults = generateAuditResults();

export function getMockAlerts(): Alert[] {
  return [
    { id: 'A1', type: 'consumo_alto', severity: 'high', message: 'Consumo 45% acima da média', placa: 'MNO5J67', data: new Date('2025-03-15') },
    { id: 'A2', type: 'sem_rastreador', severity: 'high', message: 'Abastecimento sem registro no rastreador', placa: 'ABC1D23', data: new Date('2025-03-12') },
    { id: 'A3', type: 'dados_inconsistentes', severity: 'medium', message: 'KM registrado menor que o anterior', placa: 'DEF2G34', data: new Date('2025-03-10') },
    { id: 'A4', type: 'placa_invalida', severity: 'low', message: 'Placa não encontrada na base da frota', placa: 'ZZZ0000', data: new Date('2025-03-08') },
    { id: 'A5', type: 'consumo_alto', severity: 'medium', message: 'Consumo 32% acima da média', placa: 'GHI3H45', data: new Date('2025-03-05') },
  ];
}

export function getDashboardMetrics() {
  const totalLitros = mockFuelings.reduce((s, f) => s + f.litros, 0);
  const totalValor = mockFuelings.reduce((s, f) => s + f.valor, 0);
  const totalKm = mockFuelings.reduce((s, f) => s + f.km, 0);
  const mediaKml = totalKm / totalLitros;

  const conforme = mockAuditResults.filter((r) => r.status === 'CONFORME').length;
  const suspeito = mockAuditResults.filter((r) => r.status === 'SUSPEITO').length;
  const naoConforme = mockAuditResults.filter((r) => r.status === 'NAO_CONFORME').length;

  return {
    totalAbastecimentos: mockFuelings.length,
    totalLitros: Math.round(totalLitros),
    totalValor: Math.round(totalValor * 100) / 100,
    totalKm: Math.round(totalKm),
    mediaKml: Math.round(mediaKml * 100) / 100,
    valorPorKm: Math.round((totalValor / totalKm) * 100) / 100,
    conformidade: Math.round((conforme / mockAuditResults.length) * 100),
    conforme,
    suspeito,
    naoConforme,
  };
}

export function getMonthlyData() {
  const months: Record<string, { litros: number; valor: number; km: number; count: number }> = {};
  mockFuelings.forEach((f) => {
    const key = `${f.data.getFullYear()}-${(f.data.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!months[key]) months[key] = { litros: 0, valor: 0, km: 0, count: 0 };
    months[key].litros += f.litros;
    months[key].valor += f.valor;
    months[key].km += f.km;
    months[key].count += 1;
  });

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      litros: Math.round(data.litros),
      valor: Math.round(data.valor),
      km: Math.round(data.km),
      mediaKml: Math.round((data.km / data.litros) * 100) / 100,
      abastecimentos: data.count,
    }));
}

export function getVehicleRanking() {
  const byVehicle: Record<string, { litros: number; km: number; valor: number; count: number; modelo: string }> = {};
  mockFuelings.forEach((f) => {
    if (!byVehicle[f.placa]) {
      const v = vehicles.find((v) => v.placa === f.placa);
      byVehicle[f.placa] = { litros: 0, km: 0, valor: 0, count: 0, modelo: v?.modelo || '' };
    }
    byVehicle[f.placa].litros += f.litros;
    byVehicle[f.placa].km += f.km;
    byVehicle[f.placa].valor += f.valor;
    byVehicle[f.placa].count += 1;
  });

  return Object.entries(byVehicle)
    .map(([placa, data]) => ({
      placa,
      modelo: data.modelo,
      mediaKml: Math.round((data.km / data.litros) * 100) / 100,
      totalLitros: Math.round(data.litros),
      totalValor: Math.round(data.valor),
      totalKm: Math.round(data.km),
      abastecimentos: data.count,
    }))
    .sort((a, b) => b.mediaKml - a.mediaKml);
}

export function getDriverRanking() {
  const byDriver: Record<string, { litros: number; km: number; valor: number; count: number }> = {};
  mockFuelings.forEach((f) => {
    if (!byDriver[f.motorista]) byDriver[f.motorista] = { litros: 0, km: 0, valor: 0, count: 0 };
    byDriver[f.motorista].litros += f.litros;
    byDriver[f.motorista].km += f.km;
    byDriver[f.motorista].valor += f.valor;
    byDriver[f.motorista].count += 1;
  });

  return Object.entries(byDriver)
    .map(([motorista, data]) => ({
      motorista,
      mediaKml: Math.round((data.km / data.litros) * 100) / 100,
      totalLitros: Math.round(data.litros),
      totalValor: Math.round(data.valor),
      abastecimentos: data.count,
    }))
    .sort((a, b) => b.mediaKml - a.mediaKml);
}
