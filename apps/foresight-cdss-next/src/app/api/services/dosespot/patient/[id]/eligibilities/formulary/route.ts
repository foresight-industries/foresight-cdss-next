import { NextRequest, NextResponse } from "next/server";
import axios from 'axios';
import { createDosespotToken } from '@/app/api/services/dosespot/_utils/createDosespotToken';

export default async function DosespotInitiatePriorAuthHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const ndc = searchParams.get('ndc');
    const eligibility = searchParams.get('eligibility');
    const { id: patient } = await params;

    if (!patient) {
      return NextResponse.json(
        { message: 'Dosespot Patient ID is required' },
        { status: 400 }
      );
    } else if (!ndc) {
      return NextResponse.json(
        { message: 'Dosespot NDC is required' },
        {
          status: 400
        }
      )
    } else if (!eligibility) {
      return NextResponse.json(
        { message: 'Dosespot Eligibility is required' },
        {
          status: 400
        }
      )
    }

    // Create token
    const { data: token } = await createDosespotToken(Number(process.env.DOSESPOT_USER_ID));
    const url = `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patient}/formulary`;
    const options = {
      method: 'GET',
      headers: {
        'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token.access_token}`,
      },
      url: url,
      params: { patientEligibilityId: eligibility, nDC: ndc },
    };

    console.info('PATIENT FORMULARY: ', options);
    const response = await axios(options);

    return NextResponse.json(response.data, { status: 200 });
  } catch (err) {
    console.error({ ERROR: err });

    return NextResponse.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}
