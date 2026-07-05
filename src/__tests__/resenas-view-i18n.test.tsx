import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResenasView from '../../app/dashboard/components/ResenasView';
import { api } from '../../app/lib/api';
import { clearApiCache } from '../../app/lib/api/cache';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

vi.mock('../../app/lib/api', () => ({
  api: {
    resenas: {
      getMisResenas: vi.fn(),
      responder: vi.fn(),
      borrarRespuesta: vi.fn(),
    },
  },
}));

const reviewWithoutReply = {
  id: 'resena-1',
  pacienteId: 'pac-1',
  profesionalId: 'prof-1',
  turnoId: 'turno-1',
  rating: 5,
  comentario: 'Excellent care',
  createdAt: '2026-05-18T13:00:00.000Z',
  paciente: {
    nombre: 'Ana',
    apellido: 'Perez',
  },
  turno: {
    fechaHora: '2026-05-18T13:00:00.000Z',
  },
};

const reviewWithReply = {
  ...reviewWithoutReply,
  id: 'resena-2',
  respuesta: 'Thanks for your review',
  respondidaAt: '2026-05-19T13:00:00.000Z',
};

const responseWithReviews = {
  resenas: [reviewWithoutReply, reviewWithReply],
  stats: {
    promedio: 5,
    total: 2,
    distribucion: { 5: 2, 4: 0, 3: 0, 2: 0, 1: 0 },
  },
  pagination: {
    page: 1,
    totalPages: 1,
    total: 2,
  },
};

const responseNoReviews = {
  resenas: [],
  stats: {
    promedio: null,
    total: 0,
    distribucion: {},
  },
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0,
  },
};

const responseFilteredEmpty = {
  resenas: [],
  stats: {
    promedio: 4,
    total: 2,
    distribucion: { 5: 0, 4: 2, 3: 0, 2: 0, 1: 0 },
  },
  pagination: {
    page: 1,
    totalPages: 1,
    total: 2,
  },
};

describe('ResenasView i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.resenas.getMisResenas as any).mockResolvedValue(responseWithReviews);
    (api.resenas.responder as any).mockResolvedValue({ ...reviewWithoutReply, respuesta: 'Public reply' });
    (api.resenas.borrarRespuesta as any).mockResolvedValue(undefined);
  });

  it('renders review stats, reply UI, and existing replies in English', async () => {
    render(<ResenasView />);

    expect(await screen.findByText('2 reviews')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Perez').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('"Excellent care"').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Reply to this review/ })).toBeInTheDocument();
    expect(screen.getByText('Your reply')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reply to this review/ }));

    expect(screen.getByText('Your public reply')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your reply... (visible to all patients)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish reply' })).toBeInTheDocument();
  });

  it('uses translated validation and success notices for publishing replies', async () => {
    render(<ResenasView />);

    fireEvent.click(await screen.findByRole('button', { name: /Reply to this review/ }));
    fireEvent.change(screen.getByPlaceholderText('Write your reply... (visible to all patients)'), { target: { value: 'hey' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish reply' }));

    expect(await screen.findByText('Reply must be at least 5 characters long.')).toBeInTheDocument();
    expect(api.resenas.responder).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Write your reply... (visible to all patients)'), {
      target: { value: 'Thanks for sharing your experience' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish reply' }));

    await waitFor(() => {
      expect(api.resenas.responder).toHaveBeenCalledWith('resena-1', 'Thanks for sharing your experience');
    });
    expect(await screen.findByText('Reply published.')).toBeInTheDocument();
  });

  it('uses translated success notice when deleting a reply', async () => {
    render(<ResenasView />);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(api.resenas.borrarRespuesta).toHaveBeenCalledWith('resena-2');
    });
    expect(await screen.findByText('Reply deleted.')).toBeInTheDocument();
  });

  it('renders empty and filtered-empty states in English', async () => {
    (api.resenas.getMisResenas as any)
      .mockResolvedValueOnce(responseNoReviews)
      .mockResolvedValueOnce(responseWithReviews)
      .mockResolvedValueOnce(responseFilteredEmpty);

    render(<ResenasView />);

    expect(await screen.findByText('You do not have reviews yet')).toBeInTheDocument();
    expect(screen.getByText('When a patient rates a completed appointment, it will appear here.')).toBeInTheDocument();

    cleanup();
    clearApiCache();
    render(<ResenasView />);

    expect(await screen.findByText('2 reviews')).toBeInTheDocument();
    const fiveStarFilter = screen.getAllByText('5').map(node => node.closest('button')).find(Boolean);
    expect(fiveStarFilter).not.toBeNull();
    fireEvent.click(fiveStarFilter!);

    expect(await screen.findByText('Filtering: 5★')).toBeInTheDocument();
    expect(screen.getByText('Clear filter')).toBeInTheDocument();
    expect(screen.getByText('No 5★ reviews to show.')).toBeInTheDocument();
  });
});
