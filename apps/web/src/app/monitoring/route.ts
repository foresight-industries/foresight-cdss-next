import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Extract Sentry parameters from query string
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('o');
    const projectId = searchParams.get('p');
    const region = searchParams.get('r');
    
    if (!orgId || !projectId || !region) {
      return new Response('Missing required parameters (o, p, r)', { status: 400 });
    }
    
    // Construct Sentry URL from query parameters
    const sentryUrl = `https://o${orgId}.ingest.${region}.sentry.io/api/${projectId}/envelope/`;

    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'User-Agent': request.headers.get('user-agent') ?? '',
      },
      body,
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error forwarding to Sentry:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
