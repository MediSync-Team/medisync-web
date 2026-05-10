import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAutoCoverageDisabledKey,
  getSavedCoverageFilter,
  isAutoCoverageDisabled,
  setAutoCoverageDisabled,
  shouldDisableAutoCoverage,
} from '../../app/lib/home-filters';

describe('Home filters', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('normalises known patient coverage for the search filter', () => {
    expect(getSavedCoverageFilter(' osde ')).toBe('OSDE');
    expect(getSavedCoverageFilter('SWISS MEDICAL')).toBe('SWISS MEDICAL');
  });

  it('ignores unknown or empty coverage values', () => {
    expect(getSavedCoverageFilter('unknown coverage')).toBe('');
    expect(getSavedCoverageFilter('')).toBe('');
    expect(getSavedCoverageFilter(null)).toBe('');
  });

  it('uses a per-user session key for disabling auto coverage', () => {
    expect(getAutoCoverageDisabledKey('user-1')).toBe('medisync:auto-coverage-filter-disabled:user-1');
    expect(getAutoCoverageDisabledKey()).toBeNull();
  });

  it('stores and clears the disabled preference in session storage', () => {
    expect(isAutoCoverageDisabled('user-1')).toBe(false);

    setAutoCoverageDisabled('user-1', true);
    expect(isAutoCoverageDisabled('user-1')).toBe(true);

    setAutoCoverageDisabled('user-1', false);
    expect(isAutoCoverageDisabled('user-1')).toBe(false);
  });

  it('clears only the selected user disabled preference', () => {
    setAutoCoverageDisabled('user-1', true);
    setAutoCoverageDisabled('user-2', true);

    setAutoCoverageDisabled('user-1', false);

    expect(isAutoCoverageDisabled('user-1')).toBe(false);
    expect(isAutoCoverageDisabled('user-2')).toBe(true);
  });

  it('disables auto coverage when the saved coverage is cleared', () => {
    expect(shouldDisableAutoCoverage('', 'OSDE')).toBe(true);
    expect(shouldDisableAutoCoverage('OSDE', 'OSDE')).toBe(false);
    expect(shouldDisableAutoCoverage('', '')).toBe(false);
  });
});
