import { api } from './api';

/**
 * Canonical fallback list of obras sociales, mirroring the API source of truth
 * (`medisync-api/src/routes/obras-sociales.routes.ts`). Used to validate/normalise
 * coverage names before the async API list has loaded — keeps client-side
 * filtering (and unit tests) deterministic without a network round-trip.
 */
export const KNOWN_OBRAS_SOCIALES: readonly string[] = [
  'OSDE',
  'SWISS MEDICAL',
  'MEDIFÉ',
  'GALENO',
  'ACCORD SALUD',
  'IOMA',
  'PAMI',
  'OBRA SOCIAL BANCARIA (OSBA)',
  'OBRA SOCIAL DOCENTES (DOSUBA)',
  'OBRA SOCIAL EMPLEADOS DE COMERCIO (OSECAC)',
  'OBRA SOCIAL METALÚRGICOS (OSMERA)',
  'OBRA SOCIAL PERSONAL AERONÁUTICO (OSPAT)',
  'OBRA SOCIAL PERSONAL GRÁFICO (OSPECG)',
  'OBRA SOCIAL UNIÓN PERSONAL',
  'OBRA SOCIAL CAMIONEROS',
  'HOMINIS',
  'SANCOR SALUD',
  'JERÁRQUICOS SALUD',
  'LUIS PASTEUR',
  'OMINT',
  'PARTICULAR (SIN COBERTURA)',
];

let cache: string[] | null = null;

export async function loadObrasSociales(): Promise<string[]> {
  if (cache) return cache;
  try {
    cache = await api.obrasSociales.getAll();
  } catch {
    cache = [];
  }
  return cache;
}

/**
 * Synchronous list of obras sociales. Prefers the API-loaded cache, falling back
 * to {@link KNOWN_OBRAS_SOCIALES} so callers always have a usable list.
 */
export function getObrasSociales(): string[] {
  return cache && cache.length > 0 ? cache : [...KNOWN_OBRAS_SOCIALES];
}
