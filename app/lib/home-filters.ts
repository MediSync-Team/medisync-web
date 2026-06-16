import { getObrasSociales } from './obras-sociales';

const AUTO_COVERAGE_DISABLED_PREFIX = 'medisync:auto-coverage-filter-disabled';

/** Trim, collapse internal whitespace, and upper-case for case/spacing-safe matching. */
function normaliseCoverage(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Resolve a free-form coverage string to its canonical obra-social name, or `''`
 * when it is empty/unknown. Matching is whitespace- and case-insensitive; the
 * returned value preserves the canonical casing/accents from the known list.
 */
export function getSavedCoverageFilter(obraSocial?: string | null): string {
  const normalised = normaliseCoverage(obraSocial ?? '');
  if (!normalised) return '';
  const match = getObrasSociales().find((item) => normaliseCoverage(item) === normalised);
  return match ?? '';
}

export function getAutoCoverageDisabledKey(userId?: string | null): string | null {
  return userId ? `${AUTO_COVERAGE_DISABLED_PREFIX}:${userId}` : null;
}

export function isAutoCoverageDisabled(userId?: string | null): boolean {
  const key = getAutoCoverageDisabledKey(userId);
  return typeof window !== 'undefined' && key ? sessionStorage.getItem(key) === '1' : false;
}

export function setAutoCoverageDisabled(userId: string | undefined, disabled: boolean): void {
  const key = getAutoCoverageDisabledKey(userId);
  if (typeof window === 'undefined' || !key) return;

  if (disabled) {
    sessionStorage.setItem(key, '1');
  } else {
    sessionStorage.removeItem(key);
  }
}

export function shouldDisableAutoCoverage(nextCoverage: string, savedCoverage: string): boolean {
  return Boolean(savedCoverage && !nextCoverage);
}
