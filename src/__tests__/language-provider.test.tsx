import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../app/lib/api';
import { LanguageProvider, useLang } from '../../app/lib/i18n/context';

function LanguageProbe() {
  const { lang, setLang } = useLang();

  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button onClick={() => setLang('en')}>Set English</button>
    </div>
  );
}

describe('LanguageProvider document language sync', () => {
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    localStorageStore = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key];
      }),
      clear: vi.fn(() => {
        localStorageStore = {};
      }),
    };

    vi.stubGlobal('localStorage', localStorageMock);
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('defaults the document language to Spanish when no stored language exists', async () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('es');
    });
    expect(screen.getByTestId('lang')).toHaveTextContent('es');
  });

  it('updates the document language from stored English preference', async () => {
    const setApiLanguageSpy = vi.spyOn(apiModule, 'setApiLanguage');
    localStorage.setItem('medisync-lang', 'en');

    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('lang')).toHaveTextContent('en');
      expect(document.documentElement.lang).toBe('en');
      expect(setApiLanguageSpy).toHaveBeenLastCalledWith('en');
    });
  });

  it('updates localStorage and document language when language changes', async () => {
    const setApiLanguageSpy = vi.spyOn(apiModule, 'setApiLanguage');

    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Set English' }));
    });

    expect(localStorage.getItem('medisync-lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(setApiLanguageSpy).toHaveBeenLastCalledWith('en');
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });
});
