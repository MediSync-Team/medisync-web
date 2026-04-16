import { describe, it, expect } from 'vitest';
import { estadoBadge, clinicalRiskBadge } from '../lib/utils';

describe('UI utility badges', () => {
  it('maps appointment states to expected badge classes', () => {
    expect(estadoBadge('CONFIRMADO')).toBe('badge badge-green');
    expect(estadoBadge('RESERVADO')).toBe('badge badge-yellow');
    expect(estadoBadge('COMPLETADO')).toBe('badge badge-blue');
    expect(estadoBadge('CANCELADO')).toBe('badge badge-red');
    expect(estadoBadge('AUSENTE')).toBe('badge badge-gray');
    expect(estadoBadge('UNKNOWN')).toBe('badge badge-gray');
  });

  it('maps clinical risk levels to visual classes', () => {
    expect(clinicalRiskBadge('BAJO')).toBe('badge badge-green');
    expect(clinicalRiskBadge('MEDIO')).toBe('badge badge-blue');
    expect(clinicalRiskBadge('ALTO')).toBe('badge badge-yellow');
    expect(clinicalRiskBadge('URGENTE')).toBe('badge badge-red');
    expect(clinicalRiskBadge(null)).toBe('badge badge-gray');
  });
});
