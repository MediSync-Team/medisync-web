export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    
    const response = await fetch(`${backendUrl}/pagos/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': request.headers.get('x-signature') || '',
        'x-request-id': request.headers.get('x-request-id') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('Webhook proxy error:', error);
    return Response.json({ success: false, error: 'Proxy error' }, { status: 500 });
  }
}
