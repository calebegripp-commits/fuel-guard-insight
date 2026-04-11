import * as XLSX from 'xlsx';
import { extractPlate, normalizePlate } from './plate-extractor';

/**
 * Column mapping configs for each upload flow
 */
export const RASTREADOR_COLUMNS = {
  area_rota: ['área/rota', 'area/rota', 'area_rota', 'área', 'area', 'rota'],
  unidade_rastreada: ['unidade rastreada', 'unidade_rastreada', 'unidade', 'veiculo', 'veículo'],
  data_inicial_timestamp: ['data inicial', 'data_inicial', 'data inicial timestamp', 'data'],
} as const;

export const FROTA_COLUMNS = {
  placa: ['placa', 'plate'],
  modelo: ['modelo', 'model', 'veículo', 'veiculo'],
  responsavel_local: ['responsável local', 'responsavel local', 'responsável', 'responsavel', 'local'],
} as const;

export const CONSUMO_COLUMNS = {
  data_hora: ['data/hora', 'data_hora', 'data', 'date'],
  placa: ['placa', 'plate', 'veículo', 'veiculo'],
  motorista: ['motorista', 'driver', 'condutor'],
  km_anterior: ['km ant.', 'km ant', 'km_anterior', 'km anterior', 'odômetro anterior'],
  km_rodado: ['km rodado', 'km_rodado', 'distância', 'distancia'],
  km_litro: ['km/litro', 'km_litro', 'km/l', 'consumo'],
  quantidade_total: ['quantidade total', 'quantidade_total', 'qtd total', 'litros', 'qtde'],
  preco_unitario: ['preço unitário', 'preco unitario', 'preço unit.', 'preco_unitario', 'valor unit'],
  valor_venda: ['valor venda', 'valor_venda', 'valor total', 'total'],
  produto: ['produto', 'combustível', 'combustivel', 'product'],
  posto: ['posto', 'station', 'estabelecimento'],
} as const;

export type ColumnMapping = Record<string, string | null>;

/**
 * Try to auto-map spreadsheet columns to DB fields
 */
export function autoMapColumns(
  sheetColumns: string[],
  expectedMap: Record<string, readonly string[]>
): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const [dbField, aliases] of Object.entries(expectedMap)) {
    const found = sheetColumns.find((col) => {
      const norm = col.toLowerCase().trim();
      return aliases.some((a) => norm === a || norm.includes(a));
    });
    mapping[dbField] = found ?? null;
  }
  return mapping;
}

/**
 * Parse Excel/CSV file into array of row objects
 */
export function parseSpreadsheet(buffer: ArrayBuffer): { data: Record<string, unknown>[]; columns: string[] } {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  return { data, columns };
}

/**
 * Convert a date value (Excel serial or string) to ISO string
 */
export function toISO(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') {
    // Excel serial date
    const d = new Date((value - 25569) * 86400000);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(value).trim();
  // Try DD/MM/YYYY HH:mm or DD/MM/YYYY
  const brMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (brMatch) {
    const [, d, m, y, h = '0', min = '0', sec = '0'] = brMatch;
    const dt = new Date(+y, +m - 1, +d, +h, +min, +sec);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

/**
 * Extract modelo + placa from "unidade rastreada" text
 */
export function extractModeloPlaca(text: string): { modelo: string; placa: string; placaValida: boolean } {
  if (!text) return { modelo: '', placa: '', placaValida: false };
  const cleaned = text.trim();
  // Take last 7 alphanumeric chars as potential plate
  const alphanumOnly = cleaned.replace(/[^A-Za-z0-9]/g, '');
  if (alphanumOnly.length < 7) {
    return { modelo: cleaned, placa: '', placaValida: false };
  }
  const rawPlaca = alphanumOnly.slice(-7).toUpperCase();
  const { placa_valida } = extractPlate(rawPlaca);
  // Modelo is everything before the plate
  const plateIndex = cleaned.toUpperCase().lastIndexOf(rawPlaca.slice(0, 3));
  const modelo = plateIndex > 0 ? cleaned.slice(0, plateIndex).trim().replace(/[\s/]+$/, '') : cleaned.slice(0, -7).trim();
  return { modelo, placa: rawPlaca, placaValida: placa_valida };
}

/**
 * Map a row using column mapping
 */
export function mapRow(row: Record<string, unknown>, mapping: ColumnMapping): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [dbField, sheetCol] of Object.entries(mapping)) {
    result[dbField] = sheetCol ? row[sheetCol] ?? null : null;
  }
  return result;
}
