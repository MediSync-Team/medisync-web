import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, clinicasApi, fetchApi, setApiLanguage } from '../../app/lib/api';

let localStorageStore: Record<string, string>;

beforeEach(() => {
  localStorageStore = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageStore[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageStore[key];
    }),
    clear: vi.fn(() => {
      localStorageStore = {};
    }),
  });
});

afterEach(() => {
  setApiLanguage('es');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('API Client', () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  describe('URL construction', () => {
    it('should build correct endpoint URLs', () => {
      const endpoints = {
        login: `${API_URL}/auth/login`,
        register: `${API_URL}/auth/register`,
        profesionales: `${API_URL}/profesionales`,
        turnos: `${API_URL}/turnos`,
        pagos: `${API_URL}/pagos`,
      };

      expect(endpoints.login).toContain('/auth/login');
      expect(endpoints.profesionales).toContain('/profesionales');
      expect(endpoints.turnos).toContain('/turnos');
    });

    it('should include turno ID in URLs', () => {
      const getTurnoUrl = (id: string) => `${API_URL}/turnos/${id}`;
      const getPagoStatusUrl = (turnoId: string) => `${API_URL}/pagos/estado/${turnoId}`;

      expect(getTurnoUrl('abc-123')).toBe(`${API_URL}/turnos/abc-123`);
      expect(getPagoStatusUrl('turno-456')).toBe(`${API_URL}/pagos/estado/turno-456`);
    });
  });

  describe('Request headers', () => {
    it('should build correct auth headers', () => {
      const buildAuthHeaders = (token: string | null) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
      };

      const withToken = buildAuthHeaders('jwt-token');
      expect(withToken['Authorization']).toBe('Bearer jwt-token');
      expect(withToken['Content-Type']).toBe('application/json');

      const withoutToken = buildAuthHeaders(null);
      expect(withoutToken['Authorization']).toBeUndefined();
    });
  });

  describe('Response handling', () => {
    it('should extract data from success response', () => {
      const extractData = (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Request failed');
      };

      const successResponse = { success: true, data: { id: '1', name: 'Test' } };
      expect(extractData(successResponse)).toEqual({ id: '1', name: 'Test' });

      const errorResponse = { success: false, error: { message: 'Not found' } };
      expect(() => extractData(errorResponse)).toThrow('Not found');
    });

    it('does not throw raw SyntaxError for empty JSON responses', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })));

      await expect(fetchApi('/empty-json')).rejects.toThrow('Error desconocido');
    });

    it('does not throw raw SyntaxError for malformed JSON responses', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })));

      await expect(fetchApi('/bad-json')).rejects.toThrow('Respuesta inválida del servidor');
    });

    it('localizes malformed JSON fallback errors in English', async () => {
      setApiLanguage('en');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })));

      await expect(fetchApi('/bad-json')).rejects.toThrow('Invalid server response');
    });

    it('localizes unknown fallback errors in English', async () => {
      setApiLanguage('en');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })));

      await expect(fetchApi('/empty-json')).rejects.toThrow('Unknown error');
    });

    it('localizes network fallback errors in English', async () => {
      setApiLanguage('en');
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      await expect(fetchApi('/network-error')).rejects.toThrow('Could not connect to the server. Check the API URL and CORS.');
    });

    it('keeps backend-provided error messages unchanged', async () => {
      setApiLanguage('en');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
        success: false,
        error: { code: 'BACKEND_ERROR', message: 'El backend decidió este mensaje' },
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })));

      await expect(fetchApi('/backend-error')).rejects.toThrow('El backend decidió este mensaje');
    });

    it('adds authorization through the central API client', async () => {
      localStorage.setItem('token', 'jwt-token');
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        success: true,
        data: { ok: true },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(fetchApi<{ ok: boolean }>('/with-auth')).resolves.toEqual({ ok: true });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(new Headers(init.headers).get('Authorization')).toBe('Bearer jwt-token');
    });

    it('sends authenticated booking payload without patient identity data', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        success: true,
        data: {
          turno: { id: 'turno-1', fechaHora: '2026-05-20T13:00:00.000Z', duracionMin: 30 },
          linkPago: null,
        },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
      vi.stubGlobal('fetch', fetchMock);

      await api.turnos.reservar({
        profesionalId: 'prof-1',
        fechaHora: '2026-05-20T13:00:00.000Z',
        modalidad: 'PRESENCIAL',
      });

      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(String(init.body))).toEqual({
        profesionalId: 'prof-1',
        fechaHora: '2026-05-20T13:00:00.000Z',
        modalidad: 'PRESENCIAL',
      });
    });

    it('sends clinic agenda date keys unchanged', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
        success: true,
        data: [],
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }));
      vi.stubGlobal('fetch', fetchMock);

      await clinicasApi.getAgenda('2026-05-18');

      expect(String(fetchMock.mock.calls[0][0])).toBe(`${API_URL}/clinicas/me/agenda?fecha=2026-05-18`);
    });
  });

  describe('Error handling', () => {
    it('should parse error messages from different formats', () => {
      const parseError = (response: any) => {
        if (response.error?.message) return response.error.message;
        if (response.message) return response.message;
        if (typeof response === 'string') return response;
        return 'Error desconocido';
      };

      expect(parseError({ error: { message: 'Error 1' } })).toBe('Error 1');
      expect(parseError({ message: 'Error 2' })).toBe('Error 2');
      expect(parseError('Error 3')).toBe('Error 3');
      expect(parseError({})).toBe('Error desconocido');
    });
  });
});
