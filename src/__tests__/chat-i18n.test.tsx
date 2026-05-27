import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChatModal from '../../app/components/ChatModal';
import { GlobalChatHub } from '../../app/components/GlobalChatHub';
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
    chat: {
      getMensajes: vi.fn(),
      enviar: vi.fn(),
      getUnreadGlobal: vi.fn(),
    },
    turnos: {
      getMisTurnos: vi.fn(),
      getByProfesional: vi.fn(),
    },
  },
}));

const patientUser = {
  id: 'user-1',
  rol: 'PACIENTE',
  paciente: { id: 'patient-1' },
} as any;

const professionalTurno = {
  id: 'turno-1',
  estado: 'CONFIRMADO',
  fechaHora: '2026-05-18T15:00:00.000Z',
  profesionalId: 'prof-1',
  profesional: {
    id: 'prof-1',
    nombre: 'Ana',
    apellido: 'Garcia',
  },
  pacienteId: 'patient-1',
  paciente: {
    id: 'patient-1',
    nombre: 'Fran',
    apellido: 'Diaz',
  },
} as any;

describe('chat i18n', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    (api.chat.getMensajes as any).mockResolvedValue([]);
    (api.chat.enviar as any).mockResolvedValue({
      id: 'msg-2',
      remitenteId: 'user-1',
      contenido: 'Hello there',
      createdAt: '2026-05-18T15:05:00.000Z',
      leidoAt: null,
    });
    (api.chat.getUnreadGlobal as any).mockResolvedValue({ count: 0 });
    (api.turnos.getMisTurnos as any).mockResolvedValue({ turnos: [] });
    (api.turnos.getByProfesional as any).mockResolvedValue({ turnos: [] });
  });

  it('renders ChatModal empty state and placeholder in English', async () => {
    render(
      <ChatModal
        turnoId="turno-1"
        myUserId="user-1"
        otherName="Ana Garcia"
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText('Pre-appointment chat')).toBeInTheDocument();
    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
    expect(screen.getByText('Send a message to Ana Garcia before the appointment.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your message... (Enter to send)')).toBeInTheDocument();
  });

  it('uses translated ChatModal fallback errors', async () => {
    (api.chat.getMensajes as any).mockRejectedValueOnce({});

    render(
      <ChatModal
        turnoId="turno-1"
        myUserId="user-1"
        otherName="Ana Garcia"
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText('Error loading messages')).toBeInTheDocument();
  });

  it('sends messages without changing the chat API contract', async () => {
    render(
      <ChatModal
        turnoId="turno-1"
        myUserId="user-1"
        otherName="Ana Garcia"
        onClose={vi.fn()}
      />
    );

    const input = await screen.findByPlaceholderText('Write your message... (Enter to send)');
    fireEvent.change(input, { target: { value: 'Hello there' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(api.chat.enviar).toHaveBeenCalledWith('turno-1', 'Hello there');
    });
    expect(await screen.findByText('Hello there')).toBeInTheDocument();
  });

  it('uses translated send fallback errors', async () => {
    (api.chat.enviar as any).mockRejectedValueOnce({});

    render(
      <ChatModal
        turnoId="turno-1"
        myUserId="user-1"
        otherName="Ana Garcia"
        onClose={vi.fn()}
      />
    );

    const input = await screen.findByPlaceholderText('Write your message... (Enter to send)');
    fireEvent.change(input, { target: { value: 'Hello there' } });
    fireEvent.submit(input.closest('form')!);

    expect(await screen.findByText('Could not send the message')).toBeInTheDocument();
  });

  it('renders GlobalChatHub loading and empty states in English', async () => {
    let resolveTurnos: (value: { turnos: any[] }) => void = () => undefined;
    (api.turnos.getMisTurnos as any).mockReturnValueOnce(new Promise((resolve) => {
      resolveTurnos = resolve;
    }));

    render(<GlobalChatHub user={patientUser} />);

    fireEvent.click(screen.getByRole('button', { name: 'Chats' }));

    expect(screen.getByText('Your chats')).toBeInTheDocument();
    expect(screen.getByText('Loading chats...')).toBeInTheDocument();

    await act(async () => {
      resolveTurnos({ turnos: [] });
    });

    expect(await screen.findByText('You have no active chats.')).toBeInTheDocument();
  });

  it('renders GlobalChatHub appointment rows with English labels and locale formatting', async () => {
    (api.turnos.getMisTurnos as any).mockResolvedValueOnce({ turnos: [professionalTurno] });

    render(<GlobalChatHub user={patientUser} />);

    fireEvent.click(screen.getByRole('button', { name: 'Chats' }));

    expect(await screen.findByText('Dr/a. Ana Garcia')).toBeInTheDocument();
    expect(screen.getByText('Last appointment: 05/18')).toBeInTheDocument();
  });
});
