import { NextResponse } from "next/server";
import { getPatientDemographics } from '@/app/api/services/dosespot/_utils/getPatientDemographics';
import { createDosespotToken } from '@/app/api/services/dosespot/_utils/createDosespotToken';

/**
 * @description fetches patient in dosespot format
 */

export default async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dosespotPatientId } = await params;

    if (!dosespotPatientId) {
      throw new Error(`Dosespot patient id was not provided`);
    }

    //need to add get patient demographics endpoint
    const { data: token } = await createDosespotToken(Number(process.env.DOSESPOT_PROVIDER_ID));

    if (!token) {
      throw new Error(`Could not generate token to get patient demographics`);
    }

    const patient = await getPatientDemographics(
      Number(dosespotPatientId),
      token.access_token
    );

    return NextResponse.json(
      patient,
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: err },
      { status: 422 }
    );
  }
}
