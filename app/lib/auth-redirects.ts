import type { User } from './api';

type AuthUserLike = {
  rol: User['rol'];
  paciente?: unknown;
  profesional?: unknown;
  clinica?: unknown;
};

export function getDashboardPath(user: AuthUserLike): string {
  if (user.rol === 'ADMIN') return '/dashboard/admin';
  if (user.rol === 'CLINICA' || user.clinica) return '/dashboard/clinica';
  if (user.rol === 'PACIENTE' || user.paciente) return '/dashboard/paciente';
  return '/dashboard';
}

export function getSafeRedirectPath(redirect: string | null): string | null {
  if (!redirect) return null;
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return null;
  return redirect;
}

export function getPostAuthRedirect(user: AuthUserLike, redirect: string | null): string {
  return getSafeRedirectPath(redirect) ?? getDashboardPath(user);
}

export function getProfessionalProfilePath(profesionalId: string): string {
  return `/profesional/${profesionalId}`;
}

export function getProfessionalBookingLoginPath(profesionalId: string): string {
  return `/login?redirect=${getProfessionalProfilePath(profesionalId)}`;
}
