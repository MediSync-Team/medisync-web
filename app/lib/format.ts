export function formatCurrency(n: number, locale: string, currency = 'ARS'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Argentine health-professional license (matrícula) format check. There is no
 * open public REFEPS/SISA API to verify against the registry, so we validate the
 * format: a plain number, or an MN/MP (national/provincial) prefix + number, with
 * an optional short numeric suffix. Kept in sync with the API's `utils/matricula.ts`.
 */
export const MATRICULA_MAX_LENGTH = 20;

// Optional short letter prefix (MN, MP, LP, profession/province variants, with
// optional dots/spaces) + a 2–7 digit number + an optional short numeric suffix.
const MATRICULA_REGEX = /^([A-Za-z]\.?\s?){0,4}\d{2,7}([-/]\d{1,4})?$/;

export function isValidMatricula(value: string): boolean {
  const v = value.trim();
  return v.length >= 2 && v.length <= MATRICULA_MAX_LENGTH && MATRICULA_REGEX.test(v);
}
