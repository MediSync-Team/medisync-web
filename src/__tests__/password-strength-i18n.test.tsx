import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PasswordStrengthIndicator from '../../app/components/PasswordStrengthIndicator';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

describe('PasswordStrengthIndicator i18n', () => {
  it('uses translated aria label for weak passwords', () => {
    render(<PasswordStrengthIndicator password="abc" />);

    expect(screen.getByRole('progressbar', { name: 'Password strength: Very weak' })).toBeInTheDocument();
    expect(screen.getByText('Password strength')).toBeInTheDocument();
    expect(screen.getByText('Requirements:')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('uses translated aria label for strong passwords', () => {
    render(<PasswordStrengthIndicator password="Abcdef1!" />);

    expect(screen.getByRole('progressbar', { name: 'Password strength: Strong' })).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText('At least one special character (!@#$%...)')).toBeInTheDocument();
  });
});
