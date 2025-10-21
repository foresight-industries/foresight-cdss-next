import { DosespotPrescriptionByIdResponse } from '@/types/dosespot';
import axios from 'axios';

export const getPrescriptionInfo = async (
  id: number,
  patientId: number,
  token: string
) => {
  if (!process.env.DOSESPOT_BASE_URL) {
    throw new Error('DOSESPOT_BASE_URL environment variable is missing');
  }

  const prescriptionOptions = {
    method: 'GET',
    headers: {
      'Subscription-Key': process.env.DOSESPOT_SUBSCRIPTION_KEY,
      Authorization: `Bearer ${token}`,
    },
    url: `${process.env
      .DOSESPOT_BASE_URL}/webapi/v2/api/patients/${patientId}/prescriptions/${id}`,
  };

  const { data: prescription } =
    await axios<DosespotPrescriptionByIdResponse>(prescriptionOptions);

  if (prescription.Result.ResultCode === 'ERROR') {
    const details = `Details: {Resource: PatientPrescriptionById, Patient: ${patientId}}, Prescription: ${id}`;

    throw new Error(prescription.Result.ResultDescription + `. ${details}`);
  }

  return prescription.Prescription;
};
