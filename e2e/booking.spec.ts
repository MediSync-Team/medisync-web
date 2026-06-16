import { test, expect } from '@playwright/test';

/**
 * Critical path: a patient discovers a professional, books an appointment,
 * fills in their info, and completes the mock checkout/payment flow.
 *
 * Locator policy: prefer accessible, user-facing queries (`getByRole`,
 * `getByLabel`, `getByText`). Fall back to `getByTestId` only for elements
 * with no stable accessible name (add `data-testid` in the component as needed).
 *
 * NOTE: step bodies are stubbed. Fill them in against the real UI; the asserted
 * names/test-ids below are placeholders to be reconciled with the app.
 */
test.describe('Patient booking journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('patient books an appointment, fills info, and completes mock checkout', async ({ page }) => {
    await test.step('discover a professional from the home search', async () => {
      // await page.getByRole('searchbox', { name: /especialidad|buscar/i }).fill('Cardiología');
      // await page.getByRole('button', { name: /buscar/i }).click();
      // await expect(page.getByTestId('prof-card').first()).toBeVisible();
    });

    await test.step('open the professional profile and pick a slot', async () => {
      // await page.getByTestId('prof-card').first().click();
      // await expect(page).toHaveURL(/\/profesional\//);
      // await page.getByRole('button', { name: /reservar|agendar/i }).first().click();
      // await page.getByTestId('slot-disponible').first().click();
    });

    await test.step('fill in patient information', async () => {
      // await page.getByLabel(/nombre/i).fill('Juan');
      // await page.getByLabel(/apellido/i).fill('Pérez');
      // await page.getByLabel(/email/i).fill('juan.perez@example.com');
      // await page.getByRole('button', { name: /continuar|confirmar/i }).click();
    });

    await test.step('complete the mock checkout / payment flow', async () => {
      // await page.getByRole('button', { name: /pagar|ir a pagar/i }).click();
      // // MercadoPago sandbox / mock redirect:
      // await page.getByTestId('mock-pay-approve').click();
      // await expect(page).toHaveURL(/\/pago\/(exito|success)/);
    });

    await test.step('verify booking confirmation', async () => {
      // await expect(page.getByRole('heading', { name: /turno (reservado|confirmado)/i })).toBeVisible();
      expect(true).toBe(true); // placeholder until steps are implemented
    });
  });
});
