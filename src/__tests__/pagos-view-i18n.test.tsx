import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PagosView from '../../app/dashboard/components/PagosView';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    profesional: {
      getPagos: vi.fn(),
    },
  },
}));

const pagosResponse = {
  pagos: [
    {
      id: 'pago-1',
      turnoId: 'turno-1',
      monto: 20000,
      montoNeto: 18000,
      comisionPorcentaje: 10,
      mpPaymentId: 'mp-1',
      estado: 'APROBADO',
      createdAt: '2026-05-18T14:00:00.000Z',
      turno: {
        id: 'turno-1',
        pacienteId: 'pac-1',
        profesionalId: 'prof-1',
        fechaHora: '2026-05-18T13:00:00.000Z',
        duracionMin: 30,
        estado: 'CONFIRMADO',
        modalidad: 'VIRTUAL',
        precio: 20000,
        createdAt: '2026-05-18T12:00:00.000Z',
        updatedAt: '2026-05-18T12:00:00.000Z',
        paciente: {
          id: 'pac-1',
          nombre: 'Ana',
          apellido: 'Perez',
          email: 'ana@example.com',
        },
      },
    },
    {
      id: 'pago-2',
      turnoId: 'turno-2',
      monto: 15000,
      montoNeto: 0,
      comisionPorcentaje: 10,
      estado: 'PENDIENTE',
      createdAt: '2026-05-19T14:00:00.000Z',
      turno: {
        id: 'turno-2',
        pacienteId: 'pac-2',
        profesionalId: 'prof-1',
        fechaHora: '2026-05-19T13:00:00.000Z',
        duracionMin: 30,
        estado: 'RESERVADO',
        modalidad: 'PRESENCIAL',
        precio: 15000,
        createdAt: '2026-05-19T12:00:00.000Z',
        updatedAt: '2026-05-19T12:00:00.000Z',
        paciente: null,
      },
    },
  ],
  mesesResumen: [
    { mes: '2026-05', bruto: 20000, neto: 18000, cantidad: 1 },
  ],
  totales: {
    bruto: 20000,
    neto: 18000,
    pendiente: 15000,
    aprobados: 1,
    pendientes: 1,
  },
  pagination: {
    total: 2,
    totalPages: 1,
    page: 1,
    limit: 15,
  },
};

describe('PagosView i18n', () => {
  let capturedBlob: Blob | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedBlob = null;
    (api.profesional.getPagos as any).mockResolvedValue(pagosResponse);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:test-csv';
      }),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('renders payment dashboard copy in English and exports English CSV headers', async () => {
    render(<PagosView />);

    expect(screen.getByText('Loading payments...')).toBeInTheDocument();

    expect(await screen.findByText('Billed (gross)')).toBeInTheDocument();
    expect(screen.getByText('Net received')).toBeInTheDocument();
    expect(screen.getByText('Pending collection')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Billing by appointment date - last 12 months')).toBeInTheDocument();

    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeInTheDocument();

    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Appointment')).toBeInTheDocument();
    expect(screen.getByText('Gross amount')).toBeInTheDocument();
    expect(screen.getAllByText('Approved').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('No account').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));

    await waitFor(() => {
      expect(capturedBlob).not.toBeNull();
    });
    const csv = await capturedBlob!.text();

    expect(csv).toContain('"Payment date","Appointment date","Patient","Email","Modality","Gross amount","Commission %","Net amount","Status","Payment ID MP"');
    expect(csv).toContain('"Ana Perez"');
    expect(csv).toContain('"No account"');
    expect(api.profesional.getPagos).toHaveBeenCalledTimes(2);
  });
});
