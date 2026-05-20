import { describe, expect, it } from 'vitest';
import { canCancelTurnoFromModal, canCompleteTurno, canReprogramTurno } from '../../app/lib/turno-actions';

describe('turno modal action visibility', () => {
  it('shows reprogram and cancel for reserved appointments, but not complete', () => {
    expect(canReprogramTurno('RESERVADO')).toBe(true);
    expect(canCancelTurnoFromModal('RESERVADO')).toBe(true);
    expect(canCompleteTurno('RESERVADO')).toBe(false);
  });

  it('shows reprogram, complete, and cancel for confirmed appointments', () => {
    expect(canReprogramTurno('CONFIRMADO')).toBe(true);
    expect(canCancelTurnoFromModal('CONFIRMADO')).toBe(true);
    expect(canCompleteTurno('CONFIRMADO')).toBe(true);
  });

  it('hides mutation actions for terminal appointments', () => {
    for (const estado of ['COMPLETADO', 'CANCELADO', 'AUSENTE'] as const) {
      expect(canReprogramTurno(estado)).toBe(false);
      expect(canCancelTurnoFromModal(estado)).toBe(false);
      expect(canCompleteTurno(estado)).toBe(false);
    }
  });
});
