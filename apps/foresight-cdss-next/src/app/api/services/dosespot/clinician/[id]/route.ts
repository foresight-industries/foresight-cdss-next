import { NextResponse } from "next/server";
import { createDosespotToken } from '@/app/api/services/dosespot/_utils/createDosespotToken';
import { getClinicianInfo } from '@/app/api/services/dosespot/_utils/getClinicianInfo';

export default async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dosespotProviderId } = await params;

  try {
    // Create token
    const { data: token } = await createDosespotToken(Number(dosespotProviderId));

    const clinician = await getClinicianInfo(
      Number(dosespotProviderId),
      token.access_token
    );

    return NextResponse.json(
      clinician,
      { status: 200 }
    );
  } catch (err) {
    console.log({ ERROR: err });
    return NextResponse.json(
      { message: err },
      { status: 422 }
    );
  }
}
