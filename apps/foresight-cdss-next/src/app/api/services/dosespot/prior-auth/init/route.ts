import { NextRequest, NextResponse } from "next/server";
// import { createDosespotToken } from '../../_utils/createDosespotToken';
//
// type DosespotInitiatePriorAuthBody = {
//   prescriptionId?: number;
//   rxChangeRequestId?: number;
// };

export default async function POST(
  req: NextRequest,
) {
  if (!process.env.DOSESPOT_PROVIDER_ID) {
    throw new Error(`DOSESPOT_PROVIDER_ID is not set`);
  }

  try {
    // const { prescriptionId, rxChangeRequestId } =
    //   await req.json() as DosespotInitiatePriorAuthBody;
    //
    // // Create token
    // const { data: token } = await createDosespotToken(Number(process.env.DOSESPOT_PROVIDER_ID));

    return NextResponse.json({ status: 200 });
  } catch (err) {
    console.log({ ERROR: err });
    return NextResponse.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}
