import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StarRating from '../../app/components/StarRating';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

describe('StarRating i18n', () => {
  it('uses translated read-only aria labels', () => {
    render(<StarRating value={4.5} />);

    expect(screen.getByLabelText('4.5 out of 5 stars')).toBeInTheDocument();
  });

  it('uses translated interactive aria labels and keeps click behavior', () => {
    const onChange = vi.fn();

    render(<StarRating value={2} onChange={onChange} />);

    expect(screen.getByRole('button', { name: '1 star' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2 stars' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5 stars' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '3 stars' }));

    expect(onChange).toHaveBeenCalledWith(3);
  });
});
