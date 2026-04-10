/**
 * Brazilian license plate extractor and validator
 * Supports old format (ABC1234) and Mercosul (ABC1D23)
 */

const PLATE_REGEX_OLD = /[A-Z]{3}\d{4}/;
const PLATE_REGEX_MERCOSUL = /[A-Z]{3}\d[A-Z]\d{2}/;
const PLATE_REGEX_COMBINED = /[A-Z]{3}\d[A-Z0-9]\d{2}/g;

export function extractPlate(input: string): { placa_extraida: string; placa_valida: boolean } {
  if (!input || typeof input !== 'string') {
    return { placa_extraida: '', placa_valida: false };
  }

  const cleaned = input.toUpperCase().replace(/[-\s.]/g, '');
  const matches = cleaned.match(PLATE_REGEX_COMBINED);

  if (!matches || matches.length === 0) {
    return { placa_extraida: '', placa_valida: false };
  }

  // Take the last match (plate is typically at the end)
  const plate = matches[matches.length - 1];
  const isValid = PLATE_REGEX_OLD.test(plate) || PLATE_REGEX_MERCOSUL.test(plate);

  return { placa_extraida: plate, placa_valida: isValid };
}

export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidBrazilianPlate(plate: string): boolean {
  const normalized = normalizePlate(plate);
  return PLATE_REGEX_OLD.test(normalized) || PLATE_REGEX_MERCOSUL.test(normalized);
}
