// Client-side TTL cache + in-flight dedup for the api layer.
// Per-tab module state; no-op during SSR so the Cloudflare/OpenNext worker
// never shares cached data across requests/users.

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

export const TTL = {
  short: 2 * 60_000, // volatile dashboard lists
  medium: 5 * 60_000, // profile-ish / rarely-changing user data
  tipos: 10 * 60_000, // tipos de consulta
  day: 24 * 60 * 60_000, // static catalogs
} as const;

/** Single source of truth for key strings shared by index.ts wraps and components. */
export const cacheKeys = {
  especialidades: 'especialidades',
  obrasSociales: 'obras-sociales',
  politicaCancelacion: 'politica-cancelacion',
  profesional: (id: string) => `profesionales:${id}`,
  tiposConsulta: (id: string) => `profesionales:${id}:tipos`,
  statsProfesional: 'stats:profesional',
  statsPaciente: 'stats:paciente',
  turnosProf: (id: string, desde: string, hasta: string) => `turnos:prof:${id}:${desde}:${hasta}`,
  misTurnos: (tipo: string, page: number, limit: number) => `turnos:mis:${tipo}:${page}:${limit}`,
  miHistorial: (page: number, limit: number) => `turnos:historial:${page}:${limit}`,
  pagosProf: (page: number, desde: string, hasta: string, estado: string) =>
    `pagos:prof:${page}:${desde}:${hasta}:${estado}`,
  misResenas: (page: number, limit: number, rating?: number) => `resenas:mis:${page}:${limit}:${rating ?? 'all'}`,
  auditoria: (profId: string, page: number) => `auditoria:${profId}:${page}`,
  cupones: 'cupones',
  suscripcionEstado: 'suscripciones:estado',
  bloqueos: 'bloqueos',
  recordatoriosProfesional: 'recordatorios:profesional',
  recordatoriosPaciente: 'recordatorios:paciente',
  listaEspera: 'listaEspera',
  misRecetas: 'paciente:recetas',
  misCertificados: 'paciente:certificados',
} as const;

const MAX_ENTRIES = 300;
const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();
const isBrowser = () => typeof window !== 'undefined';

/** Synchronous read; returns stale entries too — `fresh` tells the caller. */
export function peekCache<T>(key: string): { data: T; fresh: boolean } | undefined {
  const e = store.get(key);
  if (!e) return undefined;
  return { data: e.data as T, fresh: Date.now() < e.expiresAt };
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  if (!isBrowser()) return;
  store.delete(key); // refresh insertion order → Map doubles as FIFO for eviction
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  if (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
}

/**
 * Fetch-through cache with in-flight dedup.
 * - fresh entry, no force  → resolves with cached data (no request)
 * - stale/missing entry    → runs fn, caches on success
 * - concurrent same key    → callers share one promise (force included)
 * - failure                → rethrows; stale entry left intact, inflight cleared
 * Never resolves with expired data — stale-while-revalidate lives in
 * useCachedAsync (peekCache + force), not here.
 */
export async function cachedFetch<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number,
  opts?: { force?: boolean }
): Promise<T> {
  if (!isBrowser()) return fn(); // SSR pass-through

  if (!opts?.force) {
    const hit = peekCache<T>(key);
    if (hit?.fresh) return hit.data;
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = fn().then(
    (data) => {
      // Skip the write if invalidateCache()/clearApiCache() ran mid-flight.
      if (inflight.get(key) === p) {
        setCache(key, data, ttlMs);
        inflight.delete(key);
      }
      return data;
    },
    (err) => {
      if (inflight.get(key) === p) inflight.delete(key);
      throw err;
    }
  );
  inflight.set(key, p);
  return p;
}

/** Removes `prefix` and everything under `prefix:` — 'turnos' kills 'turnos:mis:…' but never 'turnosFoo'. */
export function invalidateCache(prefix: string): void {
  for (const k of [...store.keys()]) {
    if (k === prefix || k.startsWith(prefix + ':')) store.delete(k);
  }
  for (const k of [...inflight.keys()]) {
    if (k === prefix || k.startsWith(prefix + ':')) inflight.delete(k);
  }
}

export function clearApiCache(): void {
  store.clear();
  inflight.clear();
}
