import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PasswordInput from '../../app/components/PasswordInput';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

describe('PasswordInput i18n', () => {
  it('uses translated visibility toggle labels', () => {
    render(
      <PasswordInput
        id="password"
        value="secret"
        onChange={vi.fn()}
        ariaLabel="Password"
      />
    );

    const input = screen.getByLabelText('Password');
    const showButton = screen.getByRole('button', { name: 'Show password' });

    expect(input).toHaveAttribute('type', 'password');
    expect(showButton).toHaveAttribute('title', 'Show password');

    fireEvent.click(showButton);

    const hideButton = screen.getByRole('button', { name: 'Hide password' });
    expect(input).toHaveAttribute('type', 'text');
    expect(hideButton).toHaveAttribute('title', 'Hide password');

    fireEvent.click(hideButton);

    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute('title', 'Show password');
  });
});
