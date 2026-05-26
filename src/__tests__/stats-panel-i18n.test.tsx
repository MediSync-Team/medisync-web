import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StatsPanel from '../../app/components/StatsPanel';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('recharts', () => {
  const Container = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  const Series = ({ name }: { name?: string }) => <span>{name}</span>;
  return {
    ResponsiveContainer: Container,
    BarChart: Container,
    LineChart: Container,
    PieChart: Container,
    Pie: ({ data, children }: { data?: { name?: string }[]; children?: React.ReactNode }) => (
      <div>
        {data?.map((item) => <span key={item.name}>{item.name}</span>)}
        {children}
      </div>
    ),
    Cell: () => null,
    Bar: Series,
    Line: Series,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
});

const stats = {
  turnosPorMes: [
    { mes: '2026-05', total: 3, completados: 2, cancelados: 1, ausentes: 1 },
  ],
  ingresosPorMes: [
    { mes: '2026-05', bruto: 0, neto: 0 },
  ],
  resumen: {
    totalTurnos: 3,
    totalPacientes: 2,
  },
};

describe('StatsPanel i18n', () => {
  it('renders loading state in English', () => {
    render(<StatsPanel stats={null} />);

    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
  });

  it('renders statistics panel labels in English', () => {
    render(<StatsPanel stats={stats} />);

    expect(screen.getByText('Total appointments')).toBeInTheDocument();
    expect(screen.getByText('Patients attended')).toBeInTheDocument();
    expect(screen.getByText('Appointments by month')).toBeInTheDocument();
    expect(screen.getByText('Appointment status')).toBeInTheDocument();
    expect(screen.getByText('Appointments trend')).toBeInTheDocument();
    expect(screen.getByText('Revenue by month')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Cancelled').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('No-show').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Connect Mercado Pago to view revenue')).toBeInTheDocument();
  });

  it('renders no-data state for empty appointment status chart', () => {
    render(
      <StatsPanel
        stats={{
          ...stats,
          turnosPorMes: [{ mes: '2026-05', total: 0, completados: 0, cancelados: 0, ausentes: 0 }],
        }}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders revenue series labels when revenue exists', () => {
    render(
      <StatsPanel
        stats={{
          ...stats,
          ingresosPorMes: [{ mes: '2026-05', bruto: 20000, neto: 18000 }],
        }}
      />
    );

    expect(screen.getByText('Gross')).toBeInTheDocument();
    expect(screen.getByText('Net')).toBeInTheDocument();
  });
});
