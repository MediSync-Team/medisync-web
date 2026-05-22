import { getObrasSociales } from './obras-sociales';

const AUTO_COVERAGE_DISABLED_PREFIX = 'medisync:auto-coverage-filter-disabled';

export function getSavedCoverageFilter(obraSocial?: string | null): string {
  const normalised = obraSocial?.trim().toUpperCase() ?? '';
  const list = getObrasSociales();
  return list.includes(normalised) ? normalised : '';
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
