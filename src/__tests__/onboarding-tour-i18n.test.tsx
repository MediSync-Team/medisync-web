import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingTour from '../../app/components/OnboardingTour';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

const storageKey = 'medisync-tour-test';
let localStorageStore: Record<string, string>;

function renderTour() {
  render(
    <>
      <div data-onboarding="first">First target</div>
      <div data-onboarding="second">Second target</div>
      <OnboardingTour
        storageKey={storageKey}
        delay={25}
        steps={[
          {
            selector: '[data-onboarding="first"]',
            title: 'First translated step',
            description: 'First translated description',
          },
          {
            selector: '[data-onboarding="second"]',
            title: 'Second translated step',
            description: 'Second translated description',
          },
        ]}
      />
    </>
  );
}

describe('OnboardingTour i18n', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders shared tour controls in English and persists dismissal', async () => {
    renderTour();

    await act(async () => {
      vi.advanceTimersByTime(25);
    });

    expect(screen.getByRole('dialog', { name: 'Introduction tour' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close tour' })).toHaveTextContent('Skip tour');
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('First translated step')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('Second translated step')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));

    expect(screen.queryByRole('dialog', { name: 'Introduction tour' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(storageKey)).toBe('1');
  });
});
