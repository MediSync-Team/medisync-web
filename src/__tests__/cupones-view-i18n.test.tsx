import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CuponesView from '../../app/dashboard/components/CuponesView';
import type { Cupon } from '../../app/lib/api';
import translations from '../../app/lib/i18n/translations';

vi.mock('../../app/lib/i18n/context', () => ({
  useLang: () => ({
    lang: 'en',
    t: (section: keyof typeof translations.en) => translations.en[section],
  }),
}));

const baseCoupon: Cupon = {
  id: 'coupon-active',
  codigo: 'PROMO10',
  tipo: 'PORCENTAJE',
  valor: 10,
  descripcion: 'Discount for testing',
  maxUsos: 20,
  usosActuales: 3,
  activo: true,
  expiresAt: '2999-01-01T00:00:00.000Z',
  createdAt: '2026-05-18T13:00:00.000Z',
};

const coupons: Cupon[] = [
  baseCoupon,
  {
    ...baseCoupon,
    id: 'coupon-inactive',
    codigo: 'OFF20',
    activo: false,
  },
  {
    ...baseCoupon,
    id: 'coupon-expired',
    codigo: 'OLD10',
    expiresAt: '2000-01-01T00:00:00.000Z',
  },
  {
    ...baseCoupon,
    id: 'coupon-exhausted',
    codigo: 'USEDUP',
    maxUsos: 5,
    usosActuales: 5,
    expiresAt: undefined,
  },
];

describe('CuponesView i18n', () => {
  it('renders coupon status and detail labels in English', () => {
    render(
      <CuponesView
        cupones={coupons}
        loading={false}
        onShowNuevo={vi.fn()}
        onToggleActivo={vi.fn()}
        onEliminar={vi.fn()}
      />
    );

    expect(screen.getByText('Available coupons')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ New coupon' })).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Exhausted')).toBeInTheDocument();
    expect(screen.getAllByText(/^Discount:/).length).toBe(coupons.length);
    expect(screen.getAllByText(/^Uses:/).length).toBe(coupons.length);
    expect(screen.getAllByText(/^Expires:/).length).toBe(3);
  });

  it('keeps coupon action callbacks unchanged', () => {
    const onToggleActivo = vi.fn();
    const onEliminar = vi.fn();

    render(
      <CuponesView
        cupones={coupons}
        loading={false}
        onShowNuevo={vi.fn()}
        onToggleActivo={onToggleActivo}
        onEliminar={onEliminar}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Active' })[0]);
    expect(onToggleActivo).toHaveBeenCalledWith('coupon-active', true);

    const deleteButtons = screen.getAllByRole('button').filter((button) => button.textContent === '');
    fireEvent.click(deleteButtons[0]);
    expect(onEliminar).toHaveBeenCalledWith('coupon-active');
  });
});
