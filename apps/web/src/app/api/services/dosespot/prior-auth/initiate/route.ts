import { NextRequest } from 'next/server';
import { initiatePriorAuth } from '../../_utils/initiatePriorAuth';
import { createDosespotToken } from '../../_utils/createDosespotToken';

type DosespotInitiatePriorAuthBody = {
  dosespotProviderId: number;
  prescriptionId?: number;
  rxChangeRequestId?: number;
  dosespotPatientId: number;
  dosespotEligibilityId: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DosespotInitiatePriorAuthBody;
    const {
      dosespotProviderId,
      prescriptionId,
      rxChangeRequestId,
      dosespotPatientId,
      dosespotEligibilityId
    } = body;

    if (!dosespotProviderId) {
      return Response.json(
        { message: 'dosespotProviderId is required' },
        { status: 400 }
      );
    }

    if (!dosespotPatientId) {
      return Response.json(
        { message: 'dosespotPatientId is required' },
        { status: 400 }
      );
    }

    if (!dosespotEligibilityId) {
      return Response.json(
        { message: 'dosespotEligibilityId is required' },
        { status: 400 }
      );
    }

    // Validate that at least one identifier is provided
    if (!prescriptionId && !rxChangeRequestId) {
      return Response.json(
        { message: 'Either prescriptionId or rxChangeRequestId is required' },
        { status: 400 }
      );
    }

    // Create token
    const { data: token } = await createDosespotToken(dosespotProviderId);

    // Call the initiate prior auth utility function
    const result = await initiatePriorAuth(token.access_token, {
      PrescriptionId: prescriptionId,
      RxChangeId: rxChangeRequestId,
      dosespotPatientId,
      dosespotEligibilityId,
    });

    console.log('Prior auth initiated successfully:', result);

    return Response.json(result);
  } catch (err) {
    console.log({ ERROR: err });
    return Response.json(
      { message: (err as Error)?.message },
      { status: 400 }
    );
  }
}
