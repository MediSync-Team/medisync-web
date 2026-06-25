import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
  Newsreader: () => ({ variable: '--font-display' }),
}));

import { metadata } from '../../app/layout';

describe('root layout metadata', () => {
  it('uses language-neutral MediSync metadata', () => {
    expect(metadata.title).toBe('MediSync');
    expect(metadata.description).toContain('Medical scheduling and practice management platform');
    expect(metadata.description).toContain('Plataforma de gestión médica');
  });
});
