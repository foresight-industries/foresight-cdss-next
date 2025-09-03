import { DosespotInitiatePriorAuthResponse } from './types';
import axios from 'axios';

type InitializePriorAuthData = {
  PrescriptionId?: number;
  RxChangeId?: number;
  dosespotPatientId: number;
  dosespotEligibilityId: number;
};

export const initiatePriorAuth = async (
  token: string,
  data: InitializePriorAuthData
) => {
  const priorAuthOptions = {
    method: 'POST',
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
    },
    url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/priorAuths/initiate`,
    data: {
      PrescriptionId: data.PrescriptionId,
      PatientEligibilityId: data.dosespotEligibilityId,
    },
  };

  const { data: priorAuth } = await axios<DosespotInitiatePriorAuthResponse>(
    priorAuthOptions
  );

  if (priorAuth.Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: InitiatePriorAuth, RxChangeId: ${data.RxChangeId}, Prescription: ${data.PrescriptionId}}`;

    throw new Error(priorAuth.Result.ResultDescription + `. ${details}`);
  }

  return priorAuth.Id;
};
