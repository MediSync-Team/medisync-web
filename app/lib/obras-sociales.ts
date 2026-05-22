import { api } from './api';

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

export function getObrasSociales(): string[] {
  return cache ?? [];
}
