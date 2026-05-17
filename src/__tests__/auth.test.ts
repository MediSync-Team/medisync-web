import { describe, it, expect } from 'vitest';
import {
  getDashboardPath,
  getPostAuthRedirect,
  getProfessionalBookingLoginPath,
  getProfessionalProfilePath,
  getSafeRedirectPath,
} from '../../app/lib/auth-redirects';

describe('Auth Context', () => {
  describe('Post-auth redirects', () => {
    it('should route users to the correct dashboard by role', () => {
      expect(getDashboardPath({ rol: 'ADMIN' })).toBe('/dashboard/admin');
      expect(getDashboardPath({ rol: 'CLINICA' })).toBe('/dashboard/clinica');
      expect(getDashboardPath({ rol: 'PACIENTE' })).toBe('/dashboard/paciente');
      expect(getDashboardPath({ rol: 'PROFESIONAL' })).toBe('/dashboard');
    });

    it('should route profile-shaped patients to the patient dashboard', () => {
      expect(getDashboardPath({ rol: 'PROFESIONAL', paciente: { id: 'pac-1' } })).toBe('/dashboard/paciente');
    });

    it('should accept only internal redirect paths', () => {
      expect(getSafeRedirectPath('/invitacion/token-123')).toBe('/invitacion/token-123');
      expect(getSafeRedirectPath('/dashboard/paciente')).toBe('/dashboard/paciente');
      expect(getSafeRedirectPath('https://example.com')).toBeNull();
      expect(getSafeRedirectPath('http://example.com')).toBeNull();
      expect(getSafeRedirectPath('//example.com')).toBeNull();
      expect(getSafeRedirectPath(null)).toBeNull();
    });

    it('should honor invitation return redirects after login', () => {
      const patient = { rol: 'PACIENTE' as const };
      expect(getPostAuthRedirect(patient, '/invitacion/abc')).toBe('/invitacion/abc');
    });

    it('should fall back to role dashboards when redirect is unsafe', () => {
      const patient = { rol: 'PACIENTE' as const };
      expect(getPostAuthRedirect(patient, '//example.com')).toBe('/dashboard/paciente');
      expect(getPostAuthRedirect({ rol: 'PROFESIONAL' }, 'https://example.com')).toBe('/dashboard');
    });

    it('should build logged-out professional booking redirects back to the profile', () => {
      expect(getProfessionalProfilePath('prof-123')).toBe('/profesional/prof-123');
      expect(getProfessionalBookingLoginPath('prof-123')).toBe('/login?redirect=/profesional/prof-123');
    });
  });

  describe('User type checking', () => {
    it('should correctly identify user roles', () => {
      const isProfesional = (user: any) => !!user?.profesional;
      const isPaciente = (user: any) => !!user?.paciente;

      expect(isProfesional({ profesional: { id: '1' } })).toBe(true);
      expect(isProfesional({ paciente: { id: '1' } })).toBe(false);
      expect(isProfesional(null)).toBe(false);

      expect(isPaciente({ paciente: { id: '1' } })).toBe(true);
      expect(isPaciente({ profesional: { id: '1' } })).toBe(false);
    });
  });

  describe('Token management', () => {
    it('should validate token format', () => {
      const isValidTokenFormat = (token: string | null) => {
        if (!token) return false;
        const parts = token.split('.');
        return parts.length === 3;
      };

      expect(isValidTokenFormat('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.abc123')).toBe(true);
      expect(isValidTokenFormat('invalid')).toBe(false);
      expect(isValidTokenFormat(null)).toBe(false);
      expect(isValidTokenFormat('')).toBe(false);
    });

    it('should decode JWT payload', () => {
      const decodePayload = (token: string) => {
        const [, payload] = token.split('.');
        return JSON.parse(atob(payload));
      };

      const token = 'header.eyJ1c2VySWQiOiIxMjMiLCJyb2wiOiJQUk9GRVNJT05BTCJ9.signature';
      const decoded = decodePayload(token);

      expect(decoded.userId).toBe('123');
      expect(decoded.rol).toBe('PROFESIONAL');
    });
  });

  describe('Auth state transitions', () => {
    it('should handle loading states correctly', () => {
      const getAuthState = (loading: boolean, user: any) => {
        if (loading) return 'LOADING';
        if (!user) return 'UNAUTHENTICATED';
        return 'AUTHENTICATED';
      };

      expect(getAuthState(true, null)).toBe('LOADING');
      expect(getAuthState(false, null)).toBe('UNAUTHENTICATED');
      expect(getAuthState(false, { id: '1' })).toBe('AUTHENTICATED');
    });
  });
});
