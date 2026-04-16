/**
 * Import service — leitura, auto-detecção de tipo e mapeamento de colunas.
 */
import * as XLSX from 'xlsx';

export type SheetType = 'rastreador' | 'frota' | 'consumo' | 'unknown';

export interface ParsedSheet {
  data: Record<string, unknown>[];
  columns: string[];
}

/** Column aliases per target field. Order matters (more specific first). */
export const COLUMN_ALIASES = {
  rastreador: {
    area_rota: ['área/rota', 'area/rota', 'area_rota', 'área', 'area', 'rota'],
    unidade_rastreada: ['unidade rastreada', 'unidade_rastreada', 'unidade', 'veículo', 'veiculo'],
    data_inicial_timestamp: ['data inicial', 'data_inicial', 'data inicial timestamp', 'data/hora inicial', 'data'],
  },
  frota: {
    placa: ['placa', 'plate'],
    modelo: ['modelo', 'model', 'veículo', 'veiculo'],
    responsavel_local: ['responsável local', 'responsavel local', 'responsável', 'responsavel', 'local'],
  },
  consumo: {
    data_hora: ['data/hora', 'data_hora', 'data e hora', 'data', 'date'],
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
  },
} as const;

export type ColumnMapping = Record<string, string | null>;

export function parseSpreadsheet(buffer: ArrayBuffer): ParsedSheet {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  return { data, columns };
}

const norm = (s: string) => s.toLowerCase().trim();

export function autoMapColumns(
  sheetColumns: string[],
  expected: Record<string, readonly string[]>
): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const [field, aliases] of Object.entries(expected)) {
    const found = sheetColumns.find((c) => {
      const n = norm(c);
      return aliases.some((a) => n === a || n.includes(a));
    });
    mapping[field] = found ?? null;
  }
  return mapping;
}

/**
 * Auto-detect spreadsheet type based on present columns.
 * Returns the type with the highest confidence score.
 */
export function detectSheetType(columns: string[]): { type: SheetType; confidence: number; scores: Record<SheetType, number> } {
  const scores: Record<SheetType, number> = { rastreador: 0, frota: 0, consumo: 0, unknown: 0 };

  for (const [type, aliases] of Object.entries(COLUMN_ALIASES) as [Exclude<SheetType, 'unknown'>, Record<string, readonly string[]>][]) {
    const fields = Object.keys(aliases);
    let hits = 0;
    for (const field of fields) {
      const aliasList = aliases[field];
      const hit = columns.some((c) => {
        const n = norm(c);
        return aliasList.some((a) => n === a || n.includes(a));
      });
      if (hit) hits++;
    }
    scores[type] = hits / fields.length;
  }

  // Strong discriminators (boost specificity)
  const lc = columns.map(norm);
  if (lc.some((c) => c.includes('unidade rastreada'))) scores.rastreador += 0.5;
  if (lc.some((c) => c.includes('km ant') || c.includes('km/l') || c.includes('km/litro'))) scores.consumo += 0.3;
  if (lc.some((c) => c.includes('responsável') || c.includes('responsavel'))) scores.frota += 0.3;

  let best: SheetType = 'unknown';
  let bestScore = 0.4; // minimum confidence threshold
  (Object.keys(scores) as SheetType[]).forEach((t) => {
    if (t !== 'unknown' && scores[t] > bestScore) {
      best = t;
      bestScore = scores[t];
    }
  });

  return { type: best, confidence: bestScore, scores };
}

export function mapRow(row: Record<string, unknown>, mapping: ColumnMapping): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [field, col] of Object.entries(mapping)) {
    out[field] = col ? row[col] ?? null : null;
  }
  return out;
}
