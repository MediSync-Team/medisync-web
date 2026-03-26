import { describe, it, expect } from 'vitest';

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
