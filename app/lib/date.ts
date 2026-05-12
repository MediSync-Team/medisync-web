export function getLocale(lang: string): string {
  return lang === 'es' ? 'es-AR' : 'en-US';
}

export function todayInputValue(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDateInput(d: Date): string {
  return d.toISOString().split('T')[0];
}
