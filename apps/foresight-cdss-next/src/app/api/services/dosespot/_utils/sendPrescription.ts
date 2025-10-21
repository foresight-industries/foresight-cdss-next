import axios, { AxiosRequestConfig } from 'axios';
import { DosespotSendPrescriptionsResponse } from '@/types/dosespot';

type PrescriptionOptions = {
  PrescriptionId: number;
  dosespotPatientId: number;
};

export const sendPrescription = async (
  token: string,
  options: PrescriptionOptions
) => {
  if (!process.env.DOSESPOT_BASE_URL) {
    throw new Error('DOSESPOT_BASE_URL is not defined');
  }

  const sendOptions: AxiosRequestConfig = {
    method: 'POST',
    url: `${process.env.DOSESPOT_BASE_URL}/webapi/v2/api/patients/${
      options.dosespotPatientId
    }/prescriptions/send`,
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
    },
    data: { PrescriptionIds: [options.PrescriptionId] },
  };

  // Search pharmacies
  const { data: sentPrescription } =
    await axios<DosespotSendPrescriptionsResponse>(sendOptions);

  if (sentPrescription[0].Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: SendPrescription, PrescriptionId: ${options.PrescriptionId}}`;
    throw new Error(
      sentPrescription[0].Result.ResultDescription + `. ${details}`
    );
  }

  return sentPrescription[0].Id;
};
