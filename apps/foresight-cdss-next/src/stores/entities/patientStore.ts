import { StateCreator } from "zustand";

// AWS-compatible patient types
type Patient = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  phone?: string;
  email?: string;
  ssn?: string;
  mrn: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PatientProfile = {
  id: string;
  patientId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredLanguage?: string;
  ethnicity?: string;
  race?: string;
  maritalStatus?: string;
  occupation?: string;
  employer?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PatientDiagnosis = {
  id: string;
  patientId: string;
  diagnosisCode: string;
  diagnosisDescription: string;
  diagnosisDate: Date;
  isPrimary: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type Document = {
  id: string;
  patientId: string;
  organizationId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  category: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PatientPayment = {
  id: string;
  patientId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  paymentStatus: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PatientStatement = {
  id: string;
  patientId: string;
  statementDate: Date;
  balance: number;
  dueDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type Address = {
  id: string;
  patientId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  addressType: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MedicalHistory = {
  id: string;
  patientId: string;
  condition: string;
  diagnosisDate?: Date;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type PatientPharmacy = {
  id: string;
  patientId: string;
  pharmacyName: string;
  pharmacyPhone?: string;
  pharmacyAddress?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PatientQualityMeasure = {
  id: string;
  patientId: string;
  measureCode: string;
  measureName: string;
  measureValue: string;
  measureDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface PatientSlice {
  // State
  patients: Patient[];
  selectedPatient: Patient | null;
  patientProfiles: Record<string, PatientProfile>;
  patientDiagnoses: Record<string, PatientDiagnosis[]>;
  patientDocuments: Record<string, Document[]>;
  patientPayments: Record<string, PatientPayment[]>;
  patientStatements: Record<string, PatientStatement[]>;
  addresses: Record<string, Address>;
  medicalHistory: Record<string, MedicalHistory[]>;
  patientPharmacies: Record<string, PatientPharmacy[]>;
  patientQualityMeasures: Record<string, PatientQualityMeasure[]>;

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
  setPatients: (patients: Patient[]) => void;
  setSelectedPatient: (patient: Patient | null) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  removePatient: (id: string) => void;

  // Patient profile actions
  setPatientProfile: (
    patientId: string,
    profile: PatientProfile
  ) => void;
  updatePatientProfile: (
    patientId: string,
    updates: Partial<PatientProfile>
  ) => void;

  // Patient diagnoses actions
  setPatientDiagnoses: (
    patientId: string,
    diagnoses: PatientDiagnosis[]
  ) => void;
  addPatientDiagnosis: (diagnosis: PatientDiagnosis) => void;
  updatePatientDiagnosis: (
    id: string,
    updates: Partial<PatientDiagnosis>
  ) => void;
  removePatientDiagnosis: (id: string) => void;

  // Patient documents actions
  setPatientDocuments: (
    patientId: string,
    documents: Document[]
  ) => void;
  addPatientDocument: (document: Document) => void;
  updatePatientDocument: (
    id: string,
    updates: Partial<Document>
  ) => void;
  removePatientDocument: (id: string) => void;

  // Patient payments actions
  setPatientPayments: (
    patientId: string,
    payments: PatientPayment[]
  ) => void;
  addPatientPayment: (payment: PatientPayment) => void;
  updatePatientPayment: (
    id: string,
    updates: Partial<PatientPayment>
  ) => void;

  // Address actions
  setPatientAddress: (patientId: string, address: Address) => void;
  updatePatientAddress: (
    patientId: string,
    updates: Partial<Address>
  ) => void;

  // Medical history actions
  setMedicalHistory: (
    patientId: string,
    history: MedicalHistory[]
  ) => void;
  addMedicalHistory: (history: MedicalHistory) => void;
  updateMedicalHistory: (
    id: string,
    updates: Partial<MedicalHistory>
  ) => void;

  // Patient pharmacy actions
  setPatientPharmacies: (
    patientId: string,
    pharmacies: PatientPharmacy[]
  ) => void;
  addPatientPharmacy: (pharmacy: PatientPharmacy) => void;
  updatePatientPharmacy: (
    id: string,
    updates: Partial<PatientPharmacy>
  ) => void;

  // Quality measures actions
  setPatientQualityMeasures: (
    patientId: string,
    measures: PatientQualityMeasure[]
  ) => void;
  addPatientQualityMeasure: (measure: PatientQualityMeasure) => void;
  updatePatientQualityMeasure: (
    id: string,
    updates: Partial<PatientQualityMeasure>
  ) => void;

  // Async actions
  fetchPatients: () => Promise<void>;
  fetchPatientProfile: (patientId: string) => Promise<void>;
  fetchPatientDiagnoses: (patientId: string) => Promise<void>;
  fetchPatientDocuments: (patientId: string) => Promise<void>;
  fetchPatientPayments: (patientId: string) => Promise<void>;
  fetchPatientAddress: (patientId: string) => Promise<void>;
  fetchMedicalHistory: (patientId: string) => Promise<void>;
  fetchPatientPharmacies: (patientId: string) => Promise<void>;
  fetchPatientQualityMeasures: (patientId: string) => Promise<void>;
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
      const patientId = diagnosis.patientId;
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
      const patientId = document.patientId;
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
      const patientId = payment.patientId;
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
      const patientId = history.patientId;
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
        newHistory[patientId] = newHistory[patientId].map(
          (h) => (h.id === id ? { ...h, ...updates } : h)
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
      const patientId = pharmacy.patientId;
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
        newPharmacies[patientId] = newPharmacies[patientId].map(
          (p) => (p.id === id ? { ...p, ...updates } : p)
        );
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
      const patientId = measure.patientId;
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
        newMeasures[patientId] = newMeasures[patientId].map(
          (m) => (m.id === id ? { ...m, ...updates } : m)
        );
      });
      return { patientQualityMeasures: newMeasures };
    }),

  // Async actions - converted to API-based fetching
  fetchPatients: async () => {
    set({ patientsLoading: true, patientsError: null });
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
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
      const response = await fetch(`/api/patients/${patientId}/profile`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient profile');
      }
      const data = await response.json();
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
      const response = await fetch(`/api/patients/${patientId}/diagnoses`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient diagnoses');
      }
      const data = await response.json();
      get().setPatientDiagnoses(patientId, data || []);
      set({ patientDiagnosesLoading: false });
    } catch (error) {
      set({ patientDiagnosesLoading: false });
      console.error("Failed to fetch patient diagnoses:", error);
    }
  },

  fetchPatientDocuments: async (patientId) => {
    set({ patientDocumentsLoading: true });
    try {
      const response = await fetch(`/api/patients/${patientId}/documents`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient documents');
      }
      const data = await response.json();
      get().setPatientDocuments(patientId, data || []);
      set({ patientDocumentsLoading: false });
    } catch (error) {
      set({ patientDocumentsLoading: false });
      console.error("Failed to fetch patient documents:", error);
    }
  },

  fetchPatientPayments: async (patientId) => {
    set({ patientPaymentsLoading: true });
    try {
      const response = await fetch(`/api/patients/${patientId}/payments`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient payments');
      }
      const data = await response.json();
      get().setPatientPayments(patientId, data || []);
      set({ patientPaymentsLoading: false });
    } catch (error) {
      set({ patientPaymentsLoading: false });
      console.error("Failed to fetch patient payments:", error);
    }
  },

  fetchPatientAddress: async (patientId) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/address`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient address');
      }
      const data = await response.json();
      if (data) {
        get().setPatientAddress(patientId, data);
      }
    } catch (error) {
      console.error("Failed to fetch patient address:", error);
    }
  },

  fetchMedicalHistory: async (patientId) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/medical-history`);
      if (!response.ok) {
        throw new Error('Failed to fetch medical history');
      }
      const data = await response.json();
      get().setMedicalHistory(patientId, data || []);
    } catch (error) {
      console.error("Failed to fetch medical history:", error);
    }
  },

  fetchPatientPharmacies: async (patientId) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/pharmacies`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient pharmacies');
      }
      const data = await response.json();
      get().setPatientPharmacies(patientId, data || []);
    } catch (error) {
      console.error("Failed to fetch patient pharmacies:", error);
    }
  },

  fetchPatientQualityMeasures: async (patientId) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/quality-measures`);
      if (!response.ok) {
        throw new Error('Failed to fetch patient quality measures');
      }
      const data = await response.json();
      get().setPatientQualityMeasures(patientId, data || []);
    } catch (error) {
      console.error("Failed to fetch patient quality measures:", error);
    }
  },
});
