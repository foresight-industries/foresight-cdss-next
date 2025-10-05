import { Tables } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getDosespotPatientUrl } from "@/app/api/utils/dosespot/getDosespotPatientUrl";
import { getDosespotHeaders } from "@/app/api/utils/dosespot/getDosespotHeaders";
import axios, { AxiosRequestConfig } from "axios";
import { Database } from "@/types/database.types";

enum PrimaryPhoneTypeEnum {
  Beeper = 1,
  Cell = 2,
  Fax = 3,
  Home = 4,
  Work = 5,
  Night = 6,
  Primary = 7,
}

enum GenderEnum {
  Male = 1,
  Female = 2,
  Unknown = 3,
}

enum WeightUnits {
  Lb = 1,
  Kg = 2,
}

enum HeightUnits {
  In = 1,
  Cm = 2,
}

type CreateDosespotPatientInput = {
  FirstName: string;
  LastName: string;
  MiddleName?: string | null;
  Suffix?: string | null;
  Email: string;
  DateOfBirth: string;
  Gender: GenderEnum;
  PrimaryPhone: string;
  PrimaryPhoneType: PrimaryPhoneTypeEnum;
  Address1: string;
  Address2: string | null;
  City: string;
  State: string;
  ZipCode: string;
  Active: boolean;
  Weight?: number;
  WeightMetric?: WeightUnits;
  Height?: number;
  HeightMetric?: HeightUnits;
  IsHospice: boolean;
};

type PatientDosespotCreated = {
  Id?: number;
  Result: {
    ResultCode: string;
    ResultDescription: string;
  };
};

type Patient = Database['public']['Tables']['patient']['Row'];

export const createDosespotPatient = async (
  patient: Patient,
  token: string
) => {
  console.log({
    level: 'info',
    message: `Creating dosespot patient for ${patient.id}`,
  });

  const [profile, address] = await Promise.all([
    supabaseAdmin
      .from(Tables.PATIENT_PROFILE)
      .select("*")
      .eq("id", patient.profile_id ?? 0)
      .maybeSingle()
      .then(({ data }) => data),

    supabaseAdmin
      .from("address")
      .select("*")
      .eq("patient_id", patient.id)
      .maybeSingle()
      .then(({ data }) => data),
  ]);

  if (!address) {
    throw new Error(`Could not find address for patientId: ${patient.id}`);
  }

  if (!profile) {
    throw new Error(
      `Could not find profile for profile id: ${patient.profile_id}`
    );
  }

  if (!profile.phone) {
    throw new Error(`
      Patient ${patient.id} does not have phone number
    `);
  }

  const formattedPhoneNumber = profile
    .phone.replace('+1', '')
    .replace(/\D+/g, '');

  if (formattedPhoneNumber.length > 10) {
    throw new Error(
      `Patient ${patient.id}. Phone of type Primary and number ${profile.phone} is not a valid phone number.`
    );
  }

  console.log({
    level: 'info',
    message: `Getting dosespot token to create dosespot patient for ${patient.id}`,
  });

  const patientInput: CreateDosespotPatientInput = {
    FirstName: profile.first_name ?? "",
    LastName: profile.last_name ?? "",
    // MiddleName: profile.middle_name,
    // Suffix: profile.suffix,
    Email: profile.email ?? "",
    DateOfBirth: profile.birth_date ?? "",
    PrimaryPhone: formattedPhoneNumber,
    PrimaryPhoneType: PrimaryPhoneTypeEnum.Primary,
    Gender: profile.gender === "male" ? GenderEnum.Male : GenderEnum.Female,
    Address1: address.address_line_1,
    Address2: address.address_line_2,
    City: address.city,
    ZipCode: address.zip_code,
    State: address.state,
    Active: true,
    IsHospice: false,
  };

  if (patient.height) {
    patientInput.Height = patient.height;
    patientInput.HeightMetric = HeightUnits.In;
  }

  if (patient.weight) {
    patientInput.Weight = patient.weight;
    patientInput.WeightMetric = WeightUnits.Lb;
  }

  console.log({ PATIENT_INPUT: patientInput });

  const options: AxiosRequestConfig = {
    method: 'POST',
    url: getDosespotPatientUrl(),
    data: patientInput,
    headers: getDosespotHeaders(token),
  };

  const { data: dosespotPatient } = await axios<PatientDosespotCreated>(
    options
  );

  console.log({ DOSESPOT_PATIENT: dosespotPatient });

  if (!dosespotPatient.Id || dosespotPatient.Result.ResultCode === 'ERROR') {
    throw new Error(
      dosespotPatient.Result.ResultDescription ||
      `Could not create dosespot patient for patientId ${patient.id}`
    );
  }

  return supabaseAdmin
    .from('patient')
    .update({
      dosespot_patient_id: dosespotPatient.Id,
    })
    .eq('id', patient.id)
    .select('id, dosespot_patient_id')
    .maybeSingle();
};
