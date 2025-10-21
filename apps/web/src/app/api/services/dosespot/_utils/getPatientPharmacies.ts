import axios from 'axios';
import { DosespotPatientPharmacies } from '@/types/dosespot';

export const getPatientPharmacies = async (
  dosespotPatientId: number,
  token: string
) => {
  if (!process.env.DOSESPOT_BASE_URL) {
    throw new Error('DOSESPOT_BASE_URL environment variable is missing');
  }

  const options = {
    method: 'GET',
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
    },
    url: `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}/pharmacies`,
  };

  const { data: pharmacies } = await axios<DosespotPatientPharmacies>(options);

  if (pharmacies.Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: PatientPharmacies, PatientId: ${dosespotPatientId}}`;
    throw new Error(pharmacies.Result.ResultDescription + `. ${details}`);
  }

  return pharmacies.Items;
};
