import { DosespotPharmacy, DosespotPrescription } from '@/types/dosespot';

export const formatDosespotPharmacy = (dosespotPharmacy: DosespotPharmacy) => ({
  PharmacyId: dosespotPharmacy.PharmacyId,
  StoreName: dosespotPharmacy.StoreName,
  Address1: dosespotPharmacy.Address1,
  City: dosespotPharmacy.City,
  State: dosespotPharmacy.State,
  ZipCode: dosespotPharmacy.ZipCode,
});

export const formatDosespotPrescription = (
  dosespotPrescription: DosespotPrescription
) => ({
  PrescriptionId: dosespotPrescription.PrescriptionId,
  DisplayName: dosespotPrescription.DisplayName,
  NDC: dosespotPrescription.NDC,
  DoseForm: dosespotPrescription.DoseForm,
  Route: dosespotPrescription.Route,
  Strength: dosespotPrescription.Strength,
  GenericProductName: dosespotPrescription.GenericProductName,
  GenericDrugName: dosespotPrescription.GenericDrugName,
  ClinicId: dosespotPrescription.ClinicId,
  EligibilityId: dosespotPrescription.EligibilityId,
  WrittenDate: dosespotPrescription.WrittenDate,
  Directions: dosespotPrescription.Directions,
  Quantity: dosespotPrescription.Quantity,
  DispenseUnitId: dosespotPrescription.DispenseUnitId,
  DispenseUnitDescription: dosespotPrescription.DispenseUnitDescription,
  Refills: dosespotPrescription.Refills,
  DaysSupply: dosespotPrescription.DaysSupply,
  PharmacyId: dosespotPrescription.PharmacyId,
  PrescriberId: dosespotPrescription.PrescriberId,
  Status: dosespotPrescription.Status,
  DispensableDrugId: dosespotPrescription.DispensableDrugId,
});
