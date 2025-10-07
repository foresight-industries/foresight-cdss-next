import { StateCreator } from "zustand";
import type { Tables } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export interface PatientSlice {
  // State
  patients: Tables<"patient">[];
  selectedPatient: Tables<"patient"> | null;
  patientProfiles: Record<number, Tables<"patient_profile">>;
  patientDiagnoses: Record<number, Tables<"patient_diagnosis">[]>;
  patientDocuments: Record<number, Tables<"document">[]>;
  patientPayments: Record<number, Tables<"patient_payment">[]>;
  patientStatements: Record<number, Tables<"patient_statement">[]>;
  addresses: Record<number, Tables<"address">>;
  medicalHistory: Record<number, Tables<"medical_history">[]>;
  patientPharmacies: Record<number, Tables<"patient_pharmacy">[]>;
  patientQualityMeasures: Record<number, Tables<"patient_quality_measure">[]>;

  // Loading states
  patientsLoading: boolean;
  patientProfileLoading: boolean;
  patientDiagnosesLoading: boolean;
  patientDocumentsLoading: boolean;
  patientPaymentsLoading: boolean;

  // Error states
  patientsError: string | null;
  patientProfileError: string | null;

  // Actions
  setPatients: (patients: Tables<"patient">[]) => void;
  setSelectedPatient: (patient: Tables<"patient"> | null) => void;
  addPatient: (patient: Tables<"patient">) => void;
  updatePatient: (id: number, updates: Partial<Tables<"patient">>) => void;
  removePatient: (id: number) => void;

  // Patient profile actions
  setPatientProfile: (
    patientId: number,
    profile: Tables<"patient_profile">
  ) => void;
  updatePatientProfile: (
    patientId: number,
    updates: Partial<Tables<"patient_profile">>
  ) => void;

  // Patient diagnoses actions
  setPatientDiagnoses: (
    patientId: number,
    diagnoses: Tables<"patient_diagnosis">[]
  ) => void;
  addPatientDiagnosis: (diagnosis: Tables<"patient_diagnosis">) => void;
  updatePatientDiagnosis: (
    id: number,
    updates: Partial<Tables<"patient_diagnosis">>
  ) => void;
  removePatientDiagnosis: (id: number) => void;

  // Patient documents actions
  setPatientDocuments: (
    patientId: number,
    documents: Tables<"document">[]
  ) => void;
  addPatientDocument: (document: Tables<"document">) => void;
  updatePatientDocument: (
    id: number,
    updates: Partial<Tables<"document">>
  ) => void;
  removePatientDocument: (id: number) => void;

  // Patient payments actions
  setPatientPayments: (
    patientId: number,
    payments: Tables<"patient_payment">[]
  ) => void;
  addPatientPayment: (payment: Tables<"patient_payment">) => void;
  updatePatientPayment: (
    id: number,
    updates: Partial<Tables<"patient_payment">>
  ) => void;

  // Address actions
  setPatientAddress: (patientId: number, address: Tables<"address">) => void;
  updatePatientAddress: (
    patientId: number,
    updates: Partial<Tables<"address">>
  ) => void;

  // Medical history actions
  setMedicalHistory: (
    patientId: number,
    history: Tables<"medical_history">[]
  ) => void;
  addMedicalHistory: (history: Tables<"medical_history">) => void;
  updateMedicalHistory: (
    id: number,
    updates: Partial<Tables<"medical_history">>
  ) => void;

  // Patient pharmacy actions
  setPatientPharmacies: (
    patientId: number,
    pharmacies: Tables<"patient_pharmacy">[]
  ) => void;
  addPatientPharmacy: (pharmacy: Tables<"patient_pharmacy">) => void;
  updatePatientPharmacy: (
    id: number,
    updates: Partial<Tables<"patient_pharmacy">>
  ) => void;

  // Quality measures actions
  setPatientQualityMeasures: (
    patientId: number,
    measures: Tables<"patient_quality_measure">[]
  ) => void;
  addPatientQualityMeasure: (
    measure: Tables<"patient_quality_measure">
  ) => void;
  updatePatientQualityMeasure: (
    id: number,
    updates: Partial<Tables<"patient_quality_measure">>
  ) => void;

  // Async actions
  fetchPatients: () => Promise<void>;
  fetchPatientProfile: (patientId: number) => Promise<void>;
  fetchPatientDiagnoses: (patientId: number) => Promise<void>;
  fetchPatientDocuments: (patientId: number) => Promise<void>;
  fetchPatientPayments: (patientId: number) => Promise<void>;
  fetchPatientAddress: (patientId: number) => Promise<void>;
  fetchMedicalHistory: (patientId: number) => Promise<void>;
  fetchPatientPharmacies: (patientId: number) => Promise<void>;
  fetchPatientQualityMeasures: (patientId: number) => Promise<void>;
}

export const createPatientSlice: StateCreator<
  PatientSlice,
  [],
  [],
  PatientSlice
> = (set, get) => ({
  // Initial state
  patients: [],
  selectedPatient: null,
  patientProfiles: {},
  patientDiagnoses: {},
  patientDocuments: {},
  patientPayments: {},
  patientStatements: {},
  addresses: {},
  medicalHistory: {},
  patientPharmacies: {},
  patientQualityMeasures: {},

  // Loading states
  patientsLoading: false,
  patientProfileLoading: false,
  patientDiagnosesLoading: false,
  patientDocumentsLoading: false,
  patientPaymentsLoading: false,

  // Error states
  patientsError: null,
  patientProfileError: null,

  // Basic actions
  setPatients: (patients) => set({ patients }),
  setSelectedPatient: (patient) => set({ selectedPatient: patient }),

  addPatient: (patient) =>
    set((state) => ({
      patients: [...state.patients, patient],
    })),

  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      selectedPatient:
        state.selectedPatient?.id === id
          ? { ...state.selectedPatient, ...updates }
          : state.selectedPatient,
    })),

  removePatient: (id) =>
    set((state) => ({
      patients: state.patients.filter((p) => p.id !== id),
      selectedPatient:
        state.selectedPatient?.id === id ? null : state.selectedPatient,
    })),

  // Patient profile actions
  setPatientProfile: (patientId, profile) =>
    set((state) => ({
      patientProfiles: { ...state.patientProfiles, [patientId]: profile },
    })),

  updatePatientProfile: (patientId, updates) =>
    set((state) => ({
      patientProfiles: {
        ...state.patientProfiles,
        [patientId]: { ...state.patientProfiles[patientId], ...updates },
      },
    })),

  // Patient diagnoses actions
  setPatientDiagnoses: (patientId, diagnoses) =>
    set((state) => ({
      patientDiagnoses: { ...state.patientDiagnoses, [patientId]: diagnoses },
    })),

  addPatientDiagnosis: (diagnosis) =>
    set((state) => {
      const patientId = Number(diagnosis.patient_id);
      const currentDiagnoses = state.patientDiagnoses[patientId] || [];
      return {
        patientDiagnoses: {
          ...state.patientDiagnoses,
          [patientId]: [...currentDiagnoses, diagnosis],
        },
      };
    }),

  updatePatientDiagnosis: (id, updates) =>
    set((state) => {
      const newDiagnoses = { ...state.patientDiagnoses };
      Object.keys(newDiagnoses).forEach((patientId) => {
        newDiagnoses[parseInt(patientId)] = newDiagnoses[
          parseInt(patientId)
        ].map((d) => (d.id === id ? { ...d, ...updates } : d));
      });
      return { patientDiagnoses: newDiagnoses };
    }),

  removePatientDiagnosis: (id) =>
    set((state) => {
      const newDiagnoses = { ...state.patientDiagnoses };
      Object.keys(newDiagnoses).forEach((patientId) => {
        newDiagnoses[parseInt(patientId)] = newDiagnoses[
          parseInt(patientId)
        ].filter((d) => d.id !== id);
      });
      return { patientDiagnoses: newDiagnoses };
    }),

  // Patient documents actions
  setPatientDocuments: (patientId, documents) =>
    set((state) => ({
      patientDocuments: { ...state.patientDocuments, [patientId]: documents },
    })),

  addPatientDocument: (document) =>
    set((state) => {
      const patientId = Number(document.patient_id);
      const currentDocuments = state.patientDocuments[patientId] || [];
      return {
        patientDocuments: {
          ...state.patientDocuments,
          [patientId]: [...currentDocuments, document],
        },
      };
    }),

  updatePatientDocument: (id, updates) =>
    set((state) => {
      const newDocuments = { ...state.patientDocuments };
      Object.keys(newDocuments).forEach((patientId) => {
        newDocuments[parseInt(patientId)] = newDocuments[
          parseInt(patientId)
        ].map((d) => (d.id === String(id) ? { ...d, ...updates } : d));
      });
      return { patientDocuments: newDocuments };
    }),

  removePatientDocument: (id) =>
    set((state) => {
      const newDocuments = { ...state.patientDocuments };
      Object.keys(newDocuments).forEach((patientId) => {
        newDocuments[parseInt(patientId)] = newDocuments[
          parseInt(patientId)
        ].filter((d) => d.id !== String(id));
      });
      return { patientDocuments: newDocuments };
    }),

  // Patient payments actions
  setPatientPayments: (patientId, payments) =>
    set((state) => ({
      patientPayments: { ...state.patientPayments, [patientId]: payments },
    })),

  addPatientPayment: (payment) =>
    set((state) => {
      const patientId = Number(payment.patient_id);
      const currentPayments = state.patientPayments[patientId] || [];
      return {
        patientPayments: {
          ...state.patientPayments,
          [patientId]: [...currentPayments, payment],
        },
      };
    }),

  updatePatientPayment: (id, updates) =>
    set((state) => {
      const newPayments = { ...state.patientPayments };
      Object.keys(newPayments).forEach((patientId) => {
        newPayments[parseInt(patientId)] = newPayments[parseInt(patientId)].map(
          (p) => (p.id === String(id) ? { ...p, ...updates } : p)
        );
      });
      return { patientPayments: newPayments };
    }),

  // Address actions
  setPatientAddress: (patientId, address) =>
    set((state) => ({
      addresses: { ...state.addresses, [patientId]: address },
    })),

  updatePatientAddress: (patientId, updates) =>
    set((state) => ({
      addresses: {
        ...state.addresses,
        [patientId]: { ...state.addresses[patientId], ...updates },
      },
    })),

  // Medical history actions
  setMedicalHistory: (patientId, history) =>
    set((state) => ({
      medicalHistory: { ...state.medicalHistory, [patientId]: history },
    })),

  addMedicalHistory: (history) =>
    set((state) => {
      const patientId = history.patient_id;
      const currentHistory = state.medicalHistory[patientId] || [];
      return {
        medicalHistory: {
          ...state.medicalHistory,
          [patientId]: [...currentHistory, history],
        },
      };
    }),

  updateMedicalHistory: (id, updates) =>
    set((state) => {
      const newHistory = { ...state.medicalHistory };
      Object.keys(newHistory).forEach((patientId) => {
        newHistory[parseInt(patientId)] = newHistory[parseInt(patientId)].map(
          (h) => (Number(h.patient_id) === id ? { ...h, ...updates } : h)
        );
      });
      return { medicalHistory: newHistory };
    }),

  // Patient pharmacy actions
  setPatientPharmacies: (patientId, pharmacies) =>
    set((state) => ({
      patientPharmacies: {
        ...state.patientPharmacies,
        [patientId]: pharmacies,
      },
    })),

  addPatientPharmacy: (pharmacy) =>
    set((state) => {
      const patientId = pharmacy.patient_id;
      const currentPharmacies = state.patientPharmacies[patientId] || [];
      return {
        patientPharmacies: {
          ...state.patientPharmacies,
          [patientId]: [...currentPharmacies, pharmacy],
        },
      };
    }),

  updatePatientPharmacy: (id, updates) =>
    set((state) => {
      const newPharmacies = { ...state.patientPharmacies };
      Object.keys(newPharmacies).forEach((patientId) => {
        newPharmacies[parseInt(patientId)] = newPharmacies[
          parseInt(patientId)
        ].map((p) => (Number(p.patient_id) === id ? { ...p, ...updates } : p));
      });
      return { patientPharmacies: newPharmacies };
    }),

  // Quality measures actions
  setPatientQualityMeasures: (patientId, measures) =>
    set((state) => ({
      patientQualityMeasures: {
        ...state.patientQualityMeasures,
        [patientId]: measures,
      },
    })),

  addPatientQualityMeasure: (measure) =>
    set((state) => {
      const patientId = Number(measure.patient_id);
      const currentMeasures = state.patientQualityMeasures[patientId] || [];
      return {
        patientQualityMeasures: {
          ...state.patientQualityMeasures,
          [patientId]: [...currentMeasures, measure],
        },
      };
    }),

  updatePatientQualityMeasure: (id, updates) =>
    set((state) => {
      const newMeasures = { ...state.patientQualityMeasures };
      Object.keys(newMeasures).forEach((patientId) => {
        newMeasures[parseInt(patientId)] = newMeasures[parseInt(patientId)].map(
          (m) => (Number(m.id) === id ? { ...m, ...updates } : m)
        );
      });
      return { patientQualityMeasures: newMeasures };
    }),

  // Async actions
  fetchPatients: async () => {
    set({ patientsLoading: true, patientsError: null });
    try {
      const { data, error } = await supabase
        .from("patient")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ patients: data || [], patientsLoading: false });
    } catch (error) {
      set({
        patientsError:
          error instanceof Error ? error.message : "Failed to fetch patients",
        patientsLoading: false,
      });
    }
  },

  fetchPatientProfile: async (patientId) => {
    set({ patientProfileLoading: true, patientProfileError: null });
    try {
      const { data, error } = await supabase
        .from("patient_profile")
        .select("*")
        .eq("patient_id", patientId)
        .single();

      if (error) throw error;
      if (data) {
        get().setPatientProfile(patientId, data);
      }
      set({ patientProfileLoading: false });
    } catch (error) {
      set({
        patientProfileError:
          error instanceof Error
            ? error.message
            : "Failed to fetch patient profile",
        patientProfileLoading: false,
      });
    }
  },

  fetchPatientDiagnoses: async (patientId) => {
    set({ patientDiagnosesLoading: true });
    try {
      const { data, error } = await supabase
        .from("patient_diagnosis")
        .select("*")
        .eq("patient_id", patientId);

      if (error) throw error;
      get().setPatientDiagnoses(patientId, data || []);
      set({ patientDiagnosesLoading: false });
    } catch (error) {
      set({ patientDiagnosesLoading: false });
    }
  },

  fetchPatientDocuments: async (patientId) => {
    set({ patientDocumentsLoading: true });
    try {
      const { data, error } = await supabase
        .from("document")
        .select("*")
        .eq("patient_id", patientId);

      if (error) throw error;
      get().setPatientDocuments(patientId, data || []);
      set({ patientDocumentsLoading: false });
    } catch (error) {
      set({ patientDocumentsLoading: false });
    }
  },

  fetchPatientPayments: async (patientId) => {
    set({ patientPaymentsLoading: true });
    try {
      const { data, error } = await supabase
        .from("patient_payment")
        .select("*")
        .eq("patient_id", patientId);

      if (error) throw error;
      get().setPatientPayments(patientId, data || []);
      set({ patientPaymentsLoading: false });
    } catch (error) {
      set({ patientPaymentsLoading: false });
    }
  },

  fetchPatientAddress: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from("address")
        .select("*")
        .eq("patient_id", patientId)
        .single();

      if (error) throw error;
      if (data) {
        get().setPatientAddress(patientId, data);
      }
    } catch (error) {
      console.error("Failed to fetch patient address:", error);
    }
  },

  fetchMedicalHistory: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from("medical_history")
        .select("*")
        .eq("patient_id", patientId);

      if (error) throw error;
      get().setMedicalHistory(patientId, data || []);
    } catch (error) {
      console.error("Failed to fetch medical history:", error);
    }
  },

  fetchPatientPharmacies: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from("patient_pharmacy")
        .select("*")
        .eq("patient_id", patientId);

      if (error) throw error;
      get().setPatientPharmacies(patientId, data || []);
    } catch (error) {
      console.error("Failed to fetch patient pharmacies:", error);
    }
  },

  fetchPatientQualityMeasures: async (patientId) => {
    try {
      const { data, error } = await supabase
        .from("patient_quality_measure")
        .select("*")
        .eq("patient_id", patientId);

      if (error) throw error;
      get().setPatientQualityMeasures(patientId, data || []);
    } catch (error) {
      console.error("Failed to fetch patient quality measures:", error);
    }
  },
});
