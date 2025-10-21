import axios from 'axios';
import { DosespotPatientDemographicsResponse } from '@/types/dosespot';

export const getPatientDemographics = async (
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
      .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${dosespotPatientId}`,
  };

  const { data: patient } =
    await axios<DosespotPatientDemographicsResponse>(options);

  if (patient.Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: PatientDemographics, PatientId: ${dosespotPatientId}}`;
    throw new Error(patient.Result.ResultDescription + `. ${details}`);
  }

  return patient.Item;
};
