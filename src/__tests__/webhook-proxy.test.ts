import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../app/api/pagos/webhook/route';

describe('POST /api/pagos/webhook proxy', () => {
  const originalInternalApiUrl = process.env.INTERNAL_API_URL;
  const originalPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.INTERNAL_API_URL = 'https://api.test/api';
    delete process.env.NEXT_PUBLIC_API_URL;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.INTERNAL_API_URL = originalInternalApiUrl;
    process.env.NEXT_PUBLIC_API_URL = originalPublicApiUrl;
    vi.restoreAllMocks();
  });

  function makeRequest() {
    return new Request('https://web.test/api/pagos/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': 'signature',
        'x-request-id': 'request-id',
      },
      body: JSON.stringify({ type: 'payment', data: { id: 'mp-1' } }),
    });
  }

  it('passes through backend 200 responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ success: true, data: { received: true } }, { status: 200 })));

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: { received: true } });
  });

  it('passes through backend 500 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(
        { success: false, error: { code: 'WEBHOOK_PROCESSING_FAILED' } },
        { status: 500 }
      ))
    );

    const response = await POST(makeRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: { code: 'WEBHOOK_PROCESSING_FAILED' },
    });
  });
});
