export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

export type ApiErrorLanguage = 'es' | 'en';

let apiErrorLanguage: ApiErrorLanguage = 'es';

const API_FALLBACK_ERRORS: Record<ApiErrorLanguage, {
  invalidJson: string;
  unknownError: string;
  networkError: string;
}> = {
  es: {
    invalidJson: 'Respuesta inválida del servidor',
    unknownError: 'Error desconocido',
    networkError: 'No se pudo conectar con el servidor. Verificá la URL del API y CORS.',
  },
  en: {
    invalidJson: 'Invalid server response',
    unknownError: 'Unknown error',
    networkError: 'Could not connect to the server. Check the API URL and CORS.',
  },
};

export function setApiLanguage(lang: ApiErrorLanguage) {
  apiErrorLanguage = lang;
}

function apiFallbackError(key: keyof typeof API_FALLBACK_ERRORS.es) {
  return API_FALLBACK_ERRORS[apiErrorLanguage][key];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = await response.text();

  if (!body.trim()) return null;
  if (!isJson) return null;

  try {
    return JSON.parse(body) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: apiFallbackError('invalidJson'),
      },
    };
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const hasBody = options.body !== undefined && options.body !== null;
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: options.credentials ?? 'include',
    });

    const data = await parseApiResponse<T>(response);

    if (!response.ok) {
      throw new Error(data?.error?.message || `Error HTTP ${response.status}`);
    }

    if (!data?.success) {
      throw new Error(data?.error?.message || apiFallbackError('unknownError'));
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(apiFallbackError('networkError'));
    }
    throw error;
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const q = new URLSearchParams();
  for (const [k, v] of entries) {
    q.set(k, String(v));
  }
  return '?' + q.toString();
}
