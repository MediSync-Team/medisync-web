'use client';

import { useTheme } from '../lib/theme-context';
import { useLang } from '../lib/i18n/context';

export default function ThemeLangToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const l = t('lang');
  const themeLabels = t('theme');

  return (
    <div className="flex items-center gap-1">
      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
        title={lang === 'es' ? l.switchToEnglish : l.switchToSpanish}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
        </svg>
        {!compact && <span>{lang === 'es' ? 'EN' : 'ES'}</span>}
        {compact && <span>{lang === 'es' ? 'EN' : 'ES'}</span>}
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={theme === 'light' ? themeLabels.dark : themeLabels.light}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        {theme === 'light' ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        )}
        {!compact && <span className="hidden sm:inline">{theme === 'light' ? '🌙' : '☀️'}</span>}
      </button>
    </div>
  );
}
