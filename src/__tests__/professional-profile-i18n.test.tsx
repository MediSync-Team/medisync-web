import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useParams } from 'next/navigation';
import ProfesionalPage from '../../app/profesional/[id]/page';
import { api } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/auth-context', () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock('../../app/components/ThemeLangToggle', () => ({
  default: () => null,
}));

vi.mock('../../app/components/AgendarCalendario', () => ({
  default: () => null,
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    profesionales: {
      getById: vi.fn(),
      getSlots: vi.fn(),
    },
    resenas: {
      getByProfesional: vi.fn(),
    },
  },
}));

const professional = {
  id: 'prof-1',
  nombre: 'Ana',
  apellido: 'Garcia',
  telefono: null,
  genero: 'NO_ESPECIFICADO',
  precioConsulta: 12000,
  lugarAtencion: 'Av. Siempre Viva 123',
  bio: null,
  especialidad: { id: 'esp-1', nombre: 'Cardiology' },
  obrasSociales: [],
  disponibilidades: [],
};

const reviews = {
  stats: {
    total: 2,
    promedio: 4.5,
  },
  resenas: [
    {
      id: 'review-1',
      rating: 5,
      comentario: 'Great care',
      createdAt: '2026-01-15T12:00:00.000Z',
      paciente: { nombre: 'Jane', apellido: 'Patient' },
    },
    {
      id: 'review-2',
      rating: 4,
      comentario: 'Helpful',
      createdAt: '2026-01-16T12:00:00.000Z',
      paciente: { nombre: 'Alex', apellido: 'Patient' },
    },
  ],
  pagination: {
    total: 2,
    page: 1,
    limit: 5,
    totalPages: 2,
  },
};

describe('professional profile page i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ id: 'prof-1' });
    (api.resenas.getByProfesional as any).mockResolvedValue({
      stats: { total: 0, promedio: 0 },
      resenas: [],
      pagination: { total: 0, page: 1, limit: 5, totalPages: 1 },
    });
  });

  it('renders not-found state in English', async () => {
    (api.profesionales.getById as any).mockResolvedValue(null);

    render(<ProfesionalPage />);

    expect(await screen.findByText('Professional not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Search others/i })).toHaveAttribute('href', '/');
  });

  it('renders public profile review copy in English', async () => {
    (api.profesionales.getById as any).mockResolvedValue(professional);
    (api.resenas.getByProfesional as any).mockResolvedValue(reviews);

    render(<ProfesionalPage />);

    expect(await screen.findByRole('heading', { name: /Ana Garcia/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Ratings')).toBeInTheDocument();
    });
    expect(screen.getAllByText('2 reviews').length).toBeGreaterThan(0);
    expect(screen.getByTitle('Location')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next →' })).toBeInTheDocument();
    expect(screen.getByText('January 15, 2026')).toBeInTheDocument();
    expect(screen.queryByText(/Calificaciones|reseñas|Anteriores|Siguientes|enero/i)).not.toBeInTheDocument();
  });
});
