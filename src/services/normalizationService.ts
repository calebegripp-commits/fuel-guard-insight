/**
 * Normalization service — padronização de dados crus de planilhas.
 */

export function normalizePlate(input: unknown): string | null {
  if (input == null) return null;
  const s = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length >= 7 ? s.slice(-7) : s || null;
}

export function isValidBrPlate(plate: string | null | undefined): boolean {
  if (!plate) return false;
  return /^[A-Z]{3}\d{4}$/.test(plate) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate);
}

/**
 * Extract modelo + placa from "BYD/SONG PLUS SSG1A81" -> { modelo: "BYD/SONG PLUS", placa: "SSG1A81" }
 */
export function extractModeloPlaca(text: unknown): { modelo: string; placa: string | null; valida: boolean } {
  if (text == null) return { modelo: '', placa: null, valida: false };
  const raw = String(text).trim();
  const placa = normalizePlate(raw);
  if (!placa) return { modelo: raw, placa: null, valida: false };
  // Find original position of plate (best-effort): drop last 7 alphanumeric chars
  const upper = raw.toUpperCase();
  const lastIdx = upper.search(new RegExp(placa.split('').join('[^A-Z0-9]*') + '\\s*$'));
  const modelo = lastIdx > 0 ? raw.slice(0, lastIdx).trim().replace(/[\s/.\-]+$/, '') : raw.replace(placa, '').trim();
  return { modelo, placa, valida: isValidBrPlate(placa) };
}

/** Convert Excel serial / string / Date to ISO timestamp */
export function toISO(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'number') {
    // Excel serial date (days since 1899-12-30)
    const d = new Date(Math.round((value - 25569) * 86400000));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(value).trim();
  // DD/MM/YYYY [HH:mm[:ss]]
  const br = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (br) {
    const [, d, m, y, h = '0', mi = '0', se = '0'] = br;
    const year = y.length === 2 ? 2000 + +y : +y;
    const dt = new Date(year, +m - 1, +d, +h, +mi, +se);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

/** Convert BR/EN number string to number. Returns null if NaN. */
export function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let s = String(value).trim().replace(/[^\d,.\-]/g, '');
  if (!s) return null;
  // BR format: "1.234,56" -> "1234.56"; EN: "1,234.56" -> "1234.56"
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function toText(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}
