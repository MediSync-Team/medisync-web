import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { imprimirReceta } from '../../app/lib/receta-pdf';
import { imprimirHistorial } from '../../app/lib/historial-pdf';
import { exportarHistoriaClinicaPDF } from '../../app/lib/historia-clinica-pdf';

function mockPrintWindow() {
  const written: string[] = [];
  const win = {
    document: {
      write: vi.fn((html: string) => written.push(html)),
      close: vi.fn(),
    },
    print: vi.fn(),
    setTimeout: vi.fn((cb: () => void) => cb()),
  };

  vi.stubGlobal('open', vi.fn(() => win));
  vi.stubGlobal('alert', vi.fn());
  vi.stubGlobal('setTimeout', vi.fn((cb: () => void) => cb()));

  return { written, win };
}

describe('PDF timezone formatting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T02:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('formats receta emission timestamp in Argentina clinic time', () => {
    const { written } = mockPrintWindow();

    imprimirReceta({
      receta: {
        id: 'receta-1',
        turnoId: 'turno-1',
        diagnostico: 'Diagnostico',
        indicaciones: 'Indicaciones',
        emitidaAt: '2026-06-01T02:30:00.000Z',
        createdAt: '2026-06-01T02:30:00.000Z',
        updatedAt: '2026-06-01T02:30:00.000Z',
      } as any,
      profesional: {
        nombre: 'Ana',
        apellido: 'Garcia',
        especialidad: 'Clinica medica',
      },
      paciente: { nombre: 'Paciente', apellido: 'Prueba' },
      fechaHora: '2026-06-01T02:30:00.000Z',
      modalidad: 'PRESENCIAL',
    });

    expect(written.join('')).toContain('Emitida el 31 de mayo de 2026');
    expect(written.join('')).toContain('11:30 p. m.');
  });

  it('formats historial generated date in Argentina clinic time', () => {
    const { written } = mockPrintWindow();

    imprimirHistorial({
      paciente: {
        id: 'pac-1',
        nombre: 'Paciente',
        apellido: 'Prueba',
      } as any,
      turnos: [],
    });

    expect(written.join('')).toContain('Generado el 31 de mayo de 2026');
    expect(written.join('')).toContain('Generada el 31 de mayo de 2026');
  });

  it('formats historia clinica generated date in Argentina clinic time', () => {
    const { written } = mockPrintWindow();

    exportarHistoriaClinicaPDF({
      paciente: {
        nombre: 'Paciente',
        apellido: 'Prueba',
      } as any,
      resumen: {
        totalConsultas: 0,
        consultasCompletadas: 0,
        ultimaConsulta: null,
      },
      timeline: [],
    } as any, {
      nombre: 'Ana',
      apellido: 'Garcia',
    });

    expect(written.join('')).toContain('<strong>Fecha:</strong> 31 de mayo de 2026');
    expect(written.join('')).toContain('Documento generado el 31 de mayo de 2026');
  });
});
