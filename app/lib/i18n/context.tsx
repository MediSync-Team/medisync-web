'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import translations, { Lang, Translations } from './translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: <S extends keyof Translations>(section: S) => Translations[S];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

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
    return sectionData;
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
