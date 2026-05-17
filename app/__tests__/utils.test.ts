import { describe, it, expect } from 'vitest';
import {
  clinicalRiskBadge,
  estadoBadge,
  estadoCanceladoAusenteLabel,
  estadoLabel,
  generoLabel,
  invitacionEstadoLabel,
  modalidadLabel,
} from '../lib/utils';

describe('UI utility badges', () => {
  it('maps appointment states to expected badge classes', () => {
    expect(estadoBadge('CONFIRMADO')).toBe('badge badge-green');
    expect(estadoBadge('RESERVADO')).toBe('badge badge-yellow');
    expect(estadoBadge('COMPLETADO')).toBe('badge badge-blue');
    expect(estadoBadge('CANCELADO')).toBe('badge badge-red');
    expect(estadoBadge('AUSENTE')).toBe('badge badge-gray');
    expect(estadoBadge('UNKNOWN')).toBe('badge badge-gray');
  });

  it('maps appointment states to translated labels', () => {
    const es = {
      RESERVADO: 'Reservado',
      CONFIRMADO: 'Confirmado',
      COMPLETADO: 'Completado',
      CANCELADO: 'Cancelado',
      AUSENTE: 'Ausente',
    };
    const en = {
      RESERVADO: 'Reserved',
      CONFIRMADO: 'Confirmed',
      COMPLETADO: 'Completed',
      CANCELADO: 'Cancelled',
      AUSENTE: 'Absent',
    };

    expect(estadoLabel('RESERVADO', en)).toBe('Reserved');
    expect(estadoLabel('CONFIRMADO', en)).toBe('Confirmed');
    expect(estadoLabel('COMPLETADO', en)).toBe('Completed');
    expect(estadoLabel('CANCELADO', en)).toBe('Cancelled');
    expect(estadoLabel('AUSENTE', en)).toBe('Absent');
    expect(estadoCanceladoAusenteLabel(en)).toBe('Cancelled/Absent');

    expect(estadoLabel('RESERVADO', es)).toBe('Reservado');
    expect(estadoLabel('CONFIRMADO', es)).toBe('Confirmado');
    expect(estadoLabel('COMPLETADO', es)).toBe('Completado');
    expect(estadoLabel('CANCELADO', es)).toBe('Cancelado');
    expect(estadoLabel('AUSENTE', es)).toBe('Ausente');
    expect(estadoCanceladoAusenteLabel(es)).toBe('Cancelado/Ausente');
    expect(estadoLabel('UNKNOWN', en)).toBe('UNKNOWN');
  });

  it('maps clinical risk levels to visual classes', () => {
    expect(clinicalRiskBadge('BAJO')).toBe('badge badge-green');
    expect(clinicalRiskBadge('MEDIO')).toBe('badge badge-blue');
    expect(clinicalRiskBadge('ALTO')).toBe('badge badge-yellow');
    expect(clinicalRiskBadge('URGENTE')).toBe('badge badge-red');
    expect(clinicalRiskBadge(null)).toBe('badge badge-gray');
  });

  it('centralizes common translated display labels with enum fallbacks', () => {
    expect(modalidadLabel('VIRTUAL', { VIRTUAL: 'Virtual' })).toBe('Virtual');
    expect(modalidadLabel('AMBOS', { AMBOS: 'Both' })).toBe('Both');
    expect(modalidadLabel('UNKNOWN', { VIRTUAL: 'Virtual' })).toBe('UNKNOWN');

    expect(generoLabel('MASCULINO', { genderM: 'Male' })).toBe('Male');
    expect(generoLabel('NO_ESPECIFICADO', { genderNS: 'Prefer not to say' })).toBe('Prefer not to say');
    expect(generoLabel('UNKNOWN', { genderM: 'Male' })).toBe('UNKNOWN');

    expect(invitacionEstadoLabel('PENDIENTE', { invitations: { status: { PENDIENTE: 'Pending' } } })).toBe('Pending');
    expect(invitacionEstadoLabel('EXPIRADA', { invitations: { status: { EXPIRADA: 'Expired' } } })).toBe('Expired');
    expect(invitacionEstadoLabel('UNKNOWN', { invitations: { status: { PENDIENTE: 'Pending' } } })).toBe('UNKNOWN');
  });
});
