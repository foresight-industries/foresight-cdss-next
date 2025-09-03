type DosespotToken = {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  userName: string;
  '.issued': Date;
  '.expires': Date;
};

export async function GET() {
  const dosespotProviderId = process.env.DOSESPOT_PROVIDER_ID;
  if (!dosespotProviderId) {
    console.error('DOSESPOT_PROVIDER_ID is not set');
    return Response.json({ error: 'DOSESPOT_PROVIDER_ID is not set' }, { status: 500 });
  }

  if (!process.env.DOSESPOT_SUBSCRIPTION_KEY || !process.env.DOSESPOT_CLINIC_ID || !process.env.DOSESPOT_CLINIC_KEY) {
    console.error('DOSESPOT_SUBSCRIPTION_KEY, DOSESPOT_CLINIC_ID, or DOSESPOT_CLINIC_KEY is not set');
    return Response.json({ error: 'DOSESPOT_SUBSCRIPTION_KEY, DOSESPOT_CLINIC_ID, or DOSESPOT_CLINIC_KEY is not set' }, { status: 500 });
  }

  if (!process.env.DOSESPOT_BASE_URL) {
    console.error('DOSESPOT_BASE_URL is not set');
    return Response.json({ error: 'DOSESPOT_BASE_URL is not set' }, { status: 500 });
  }

  try {
    const options = {
      method: 'POST',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
        accept: 'application/json; charset=utf-8',
      },
      data: {
        grant_type: 'password',
        client_id: process.env.DOSESPOT_CLINIC_ID,
        client_secret: process.env.DOSESPOT_CLINIC_KEY,
        username: dosespotProviderId,
        password: process.env.DOSESPOT_CLINIC_KEY,
        scope: 'api',
      },
      url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/connect/token`,
    };

    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: new URLSearchParams(options.data),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DosespotToken = await response.json();
    return Response.json(data);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}
