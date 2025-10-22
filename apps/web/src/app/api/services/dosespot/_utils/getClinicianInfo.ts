import axios from 'axios';
import { DosespotClinicianInformationResponse } from '@/types/dosespot';

export const getClinicianInfo = async (clinicianId: number, token: string) => {
  if (!process.env.DOSESPOT_BASE_URL) {
    throw new Error('DOSESPOT_BASE_URL environment variable is missing');
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

  const { data: clinician } =
    await axios<DosespotClinicianInformationResponse>(clinicianInfoOption);

  if (clinician.Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: ClinicianById, ClinicianId: ${clinicianId}}`;
    throw new Error(clinician.Result.ResultDescription + `. ${details}`);
  }

  return clinician.Item;
};
