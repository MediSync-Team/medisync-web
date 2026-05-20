import type { Turno } from './api';

type TurnoEstado = Turno['estado'];

export function canReprogramTurno(estado: TurnoEstado): boolean {
  return estado === 'RESERVADO' || estado === 'CONFIRMADO';
}

export function canCompleteTurno(estado: TurnoEstado): boolean {
  return estado === 'CONFIRMADO';
}

export function canCancelTurnoFromModal(estado: TurnoEstado): boolean {
  return estado === 'RESERVADO' || estado === 'CONFIRMADO';
}
