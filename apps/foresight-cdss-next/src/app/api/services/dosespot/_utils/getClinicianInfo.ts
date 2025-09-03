import axios from 'axios';
import { DosespotClinicianInformationResponse } from './types';

export const getClinicianInfo = async (clinicianId: number, token: string) => {
  if (!process.env.DOSESPOT_SUBSCRIPTION_KEY) {
    throw new Error('DOSESPOT_SUBSCRIPTION_KEY is not set');
  } else if (!process.env.DOSESPOT_BASE_URL) {
    throw new Error('DOSESPOT_BASE_URL is not set');
  }

  const clinicianInfoOption = {
    method: 'GET',
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
    },
    url: `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/clinicians/${clinicianId}`,
  };

  const { data: clinician } = await axios<DosespotClinicianInformationResponse>(
    clinicianInfoOption
  );

  if (clinician.Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: ClinicianById, ClinicianId: ${clinicianId}}`;
    throw new Error(clinician.Result.ResultDescription + `. ${details}`);
  }

  return clinician.Item;
};
