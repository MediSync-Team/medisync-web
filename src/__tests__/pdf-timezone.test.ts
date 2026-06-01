import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { imprimirReceta } from '../../app/lib/receta-pdf';
import { imprimirHistorial } from '../../app/lib/historial-pdf';
import { exportarHistoriaClinicaPDF } from '../../app/lib/historia-clinica-pdf';
import { imprimirCertificado } from '../../app/lib/certificado-pdf';

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

  it('renders receta PDF shell in English when requested', () => {
    const { written } = mockPrintWindow();

    imprimirReceta({
      receta: {
        id: 'receta-1',
        turnoId: 'turno-1',
        diagnostico: 'Diagnosis content',
        indicaciones: 'Instructions content',
        emitidaAt: '2026-06-01T02:30:00.000Z',
        createdAt: '2026-06-01T02:30:00.000Z',
        updatedAt: '2026-06-01T02:30:00.000Z',
      } as any,
      profesional: {
        nombre: 'Ana',
        apellido: 'Garcia',
        especialidad: 'Clinical medicine',
      },
      paciente: { nombre: 'Patient', apellido: 'Test' },
      fechaHora: '2026-06-01T02:30:00.000Z',
      modalidad: 'PRESENCIAL',
    }, 'en');

    const html = written.join('');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Prescription and Medical Instructions');
    expect(html).toContain('Print / Save as PDF');
    expect(html).toContain('Diagnosis');
    expect(html).toContain('Issued on May 31, 2026');
    expect(html).toContain('11:30 PM');
  });

  it('renders certificado PDF shell in English when requested', () => {
    const { written } = mockPrintWindow();

    imprimirCertificado({
      id: 'certificado-1',
      turnoId: 'turno-1',
      tipo: 'REPOSO',
      diagnostico: 'Diagnosis content',
      texto: 'Certificate body content',
      diasReposo: 2,
      emitidaAt: '2026-06-01T02:30:00.000Z',
      createdAt: '2026-06-01T02:30:00.000Z',
      turno: {
        fechaHora: '2026-06-01T02:30:00.000Z',
        modalidad: 'PRESENCIAL',
        profesional: {
          nombre: 'Ana',
          apellido: 'Garcia',
          matricula: '12345',
          fotoUrl: null,
          lugarAtencion: 'Clinic',
          telefono: '123',
          especialidad: { nombre: 'Clinical medicine' },
        },
        paciente: {
          nombre: 'Patient',
          apellido: 'Test',
          email: 'patient@example.com',
          dni: '12345678',
          fechaNacimiento: null,
          obraSocial: null,
        },
      },
    } as any, 'en');

    const html = written.join('');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Medical Certificate');
    expect(html).toContain('Medical Rest');
    expect(html).toContain('The undersigned');
    expect(html).toContain('Diagnosis');
    expect(html).toContain('Print or Download PDF');
  });

  it('uses English certificado popup-blocked alert when requested', () => {
    vi.stubGlobal('open', vi.fn(() => null));
    vi.stubGlobal('alert', vi.fn());

    imprimirCertificado({
      id: 'certificado-1',
      turnoId: 'turno-1',
      tipo: 'CONSULTA',
      diagnostico: 'Diagnosis content',
      texto: 'Certificate body content',
      diasReposo: null,
      emitidaAt: '2026-06-01T02:30:00.000Z',
      createdAt: '2026-06-01T02:30:00.000Z',
      turno: {
        fechaHora: '2026-06-01T02:30:00.000Z',
        modalidad: 'VIRTUAL',
        profesional: {
          nombre: 'Ana',
          apellido: 'Garcia',
          matricula: null,
          fotoUrl: null,
          lugarAtencion: null,
          telefono: '',
          especialidad: { nombre: 'Clinical medicine' },
        },
        paciente: null,
      },
    } as any, 'en');

    expect(alert).toHaveBeenCalledWith('Please allow pop-up windows to download the certificate.');
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

  it('renders historial PDF shell in English when requested', () => {
    const { written } = mockPrintWindow();

    imprimirHistorial({
      paciente: {
        id: 'pac-1',
        nombre: 'Patient',
        apellido: 'Test',
      } as any,
      turnos: [],
    }, 'en');

    const html = written.join('');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Digital Clinical History');
    expect(html).toContain('Patient data');
    expect(html).toContain('Consultation history (0)');
    expect(html).toContain('Generated on May 31, 2026');
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

  it('renders historia clinica PDF shell in English when requested', () => {
    const { written } = mockPrintWindow();

    exportarHistoriaClinicaPDF({
      paciente: {
        nombre: 'Patient',
        apellido: 'Test',
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
    }, 'en');

    const html = written.join('');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('Clinical History');
    expect(html).toContain('Total consultations');
    expect(html).toContain('Patient data');
    expect(html).toContain('Print / Save PDF');
    expect(html).toContain('Close');
    expect(html).toContain('Document generated on May 31, 2026');
  });
});
