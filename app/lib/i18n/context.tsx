'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import translations, { Lang, Translations } from './translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: <S extends keyof Translations>(section: S) => Translations[S];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const MOJIBAKE_REPAIRS: Array<[string, string]> = [
  ['\u00C3\u00A1', 'á'], ['\u00C3\u00A9', 'é'], ['\u00C3\u00AD', 'í'], ['\u00C3\u00B3', 'ó'], ['\u00C3\u00BA', 'ú'],
  ['\u00C3\u0081', 'Á'], ['\u00C3\u0089', 'É'], ['\u00C3\u008D', 'Í'], ['\u00C3\u0093', 'Ó'], ['\u00C3\u009A', 'Ú'],
  ['\u00C3\u00B1', 'ñ'], ['\u00C3\u0091', 'Ñ'], ['\u00C3\u00BC', 'ü'], ['\u00C3\u009C', 'Ü'],
  ['\u00C2\u00BF', '¿'], ['\u00C2\u00A1', '¡'], ['\u00C2\u00B7', '·'], ['\u00C2\u0020', ' '],
  ['\u00E2\u20AC\u201D', '-'], ['\u00E2\u20AC\u201C', '-'], ['\u00E2\u20AC\u00A6', '...'], ['\u00E2\u02DC\u2026', '★'], ['\u00E2\u0153\u201C', '✓'],
];

function repairMojibakeString(value: string): string {
  let result = value;
  for (const [broken, fixed] of MOJIBAKE_REPAIRS) {
    result = result.split(broken).join(fixed);
  }
  return result;
}

function repairMojibakeDeep<T>(value: T): T {
  if (typeof value === 'string') return repairMojibakeString(value) as T;
  if (typeof value === 'function') return value;
  if (Array.isArray(value)) return value.map((item) => repairMojibakeDeep(item)) as T;
  if (value && typeof value === 'object') {
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return value;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    const repaired = Object.fromEntries(entries.map(([k, v]) => [k, repairMojibakeDeep(v)]));
    return repaired as T;
  }
  return value;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const stored = localStorage.getItem('medisync-lang') as Lang | null;
    if (stored && stored in translations) setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('medisync-lang', l);
  }, []);

  const t = useCallback(<S extends keyof Translations>(section: S): Translations[S] => {
    const sectionData = (translations[lang] as Translations)[section];
    return repairMojibakeDeep(sectionData);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
