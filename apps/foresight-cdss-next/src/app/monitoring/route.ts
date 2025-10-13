import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Forward the request to Sentry
    const sentryUrl = `https://o4509918086955008.ingest.us.sentry.io/api/4509918121623552/envelope/`;

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
