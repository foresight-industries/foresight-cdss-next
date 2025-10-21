import { NextRequest } from 'next/server';
import { createDosespotToken } from '../_utils/createDosespotToken';
import { getClinicianInfo } from '../_utils/getClinicianInfo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dosespotProviderId } = body;

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const clinician = await getClinicianInfo(
      dosespotProviderId,
      token.access_token
    );

    return Response.json(clinician);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}

// If you need to handle other operations like listing clinicians
export async function GET(request: NextRequest) {
  try {
    // Handle GET requests for listing clinicians or other operations
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return Response.json(
        { message: 'providerId query parameter is required' },
        { status: 400 }
      );
    }

    const dosespotProviderId = parseInt(providerId);

    if (isNaN(dosespotProviderId)) {
      return Response.json(
        { message: 'Invalid provider ID' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    const clinician = await getClinicianInfo(
      dosespotProviderId,
      token.access_token
    );

    return Response.json(clinician);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}
