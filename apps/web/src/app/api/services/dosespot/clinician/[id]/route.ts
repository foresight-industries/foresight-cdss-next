import { NextRequest } from 'next/server';
import { createDosespotToken } from '../../_utils/createDosespotToken';
import { getClinicianInfo } from '../../_utils/getClinicianInfo';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dosespotProviderId = Number.parseInt(params.id);

    if (Number.isNaN(dosespotProviderId)) {
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { dosespotProviderId } = body;

    // Use the ID from URL params if not provided in body
    const providerId = dosespotProviderId || Number.parseInt(params.id);

    if (isNaN(providerId)) {
      return Response.json(
        { message: 'Invalid provider ID' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(providerId);

    const clinician = await getClinicianInfo(
      providerId,
      token.access_token
    );

    return Response.json(clinician);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(err, { status: 422 });
  }
}
