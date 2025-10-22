import { StateCreator } from "zustand";

// AWS-compatible provider types
type Clinician = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  npi?: string;
  specialty?: string;
  licenseNumber?: string;
  licenseState?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ProviderCredentialing = {
  id: string;
  clinicianId: string;
  payerId: string;
  credentialingStatus: string;
  applicationDate?: Date;
  approvalDate?: Date;
  expirationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProviderEnrollment = {
  id: string;
  clinicianId: string;
  payerId: string;
  enrollmentStatus: string;
  applicationDate?: Date;
  effectiveDate?: Date;
  terminationDate?: Date;
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProviderSchedule = {
  id: string;
  clinicianId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  locationId?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ServiceLocation = {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Encounter = {
  id: string;
  patientId: string;
  clinicianId: string;
  encounterDate: Date;
  encounterType: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type Appointment = {
  id: string;
  patientId: string;
  clinicianId: string;
  scheduledAt: Date;
  duration: number;
  status: string;
  appointmentType: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type Referral = {
  id: string;
  patientId: string;
  referringClinicianId: string;
  referredToClinicianId?: string;
  specialty: string;
  reason: string;
  urgency: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface ProviderSlice {
  // State
  clinicians: Clinician[];
  selectedClinician: Clinician | null;
  providerCredentialing: Record<string, ProviderCredentialing[]>;
  providerEnrollment: Record<string, ProviderEnrollment[]>;
  providerSchedules: Record<string, ProviderSchedule[]>;
  serviceLocations: ServiceLocation[];
  encounters: Encounter[];
  appointments: Appointment[];
  referrals: Referral[];

  // Loading states
  cliniciansLoading: boolean;
  providerCredentialingLoading: boolean;
  providerEnrollmentLoading: boolean;
  providerSchedulesLoading: boolean;
  serviceLocationsLoading: boolean;
  encountersLoading: boolean;
  appointmentsLoading: boolean;

  // Error states
  cliniciansError: string | null;
  providerCredentialingError: string | null;
  providerEnrollmentError: string | null;

  // Filter state
  providerFilters: {
    specialty?: string;
    location?: string;
    credentialingStatus?: string[];
    enrollmentStatus?: string[];
    activeOnly?: boolean;
  };

  // Actions
  setClinicians: (clinicians: Clinician[]) => void;
  setSelectedClinician: (clinician: Clinician | null) => void;
  addClinician: (clinician: Clinician) => void;
  updateClinician: (id: string, updates: Partial<Clinician>) => void;
  removeClinician: (id: string) => void;

  // Provider credentialing actions
  setProviderCredentialing: (
    clinicianId: string,
    credentialing: ProviderCredentialing[]
  ) => void;
  addProviderCredentialing: (credentialing: ProviderCredentialing) => void;
  updateProviderCredentialing: (
    id: string,
    updates: Partial<ProviderCredentialing>
  ) => void;
  removeProviderCredentialing: (id: string) => void;

  // Provider enrollment actions
  setProviderEnrollment: (
    clinicianId: string,
    enrollment: ProviderEnrollment[]
  ) => void;
  addProviderEnrollment: (enrollment: ProviderEnrollment) => void;
  updateProviderEnrollment: (
    id: string,
    updates: Partial<ProviderEnrollment>
  ) => void;
  removeProviderEnrollment: (id: string) => void;

  // Provider schedules actions
  setProviderSchedules: (
    clinicianId: string,
    schedules: ProviderSchedule[]
  ) => void;
  addProviderSchedule: (schedule: ProviderSchedule) => void;
  updateProviderSchedule: (
    id: string,
    updates: Partial<ProviderSchedule>
  ) => void;
  removeProviderSchedule: (id: string) => void;

  // Service locations actions
  setServiceLocations: (locations: ServiceLocation[]) => void;
  addServiceLocation: (location: ServiceLocation) => void;
  updateServiceLocation: (
    id: string,
    updates: Partial<ServiceLocation>
  ) => void;
  removeServiceLocation: (id: string) => void;

  // Encounters actions
  setEncounters: (encounters: Encounter[]) => void;
  addEncounter: (encounter: Encounter) => void;
  updateEncounter: (id: string, updates: Partial<Encounter>) => void;
  removeEncounter: (id: string) => void;

  // Appointments actions
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (
    id: string,
    updates: Partial<Appointment>
  ) => void;
  removeAppointment: (id: string) => void;

  // Referrals actions
  setReferrals: (referrals: Referral[]) => void;
  addReferral: (referral: Referral) => void;
  updateReferral: (id: string, updates: Partial<Referral>) => void;
  removeReferral: (id: string) => void;

  // Filter actions
  setProviderFilters: (filters: ProviderSlice["providerFilters"]) => void;
  clearProviderFilters: () => void;

  // Async actions
  fetchClinicians: () => Promise<void>;
  fetchClinicianById: (id: string) => Promise<void>;
  fetchProviderCredentialing: (clinicianId: string) => Promise<void>;
  fetchProviderEnrollment: (clinicianId: string) => Promise<void>;
  fetchProviderSchedules: (clinicianId: string) => Promise<void>;
  fetchServiceLocations: () => Promise<void>;
  fetchEncounters: () => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchReferrals: () => Promise<void>;
  createEncounter: (encounterData: Partial<Encounter>) => Promise<void>;
  scheduleAppointment: (appointmentData: Partial<Appointment>) => Promise<void>;
}

export const createProviderSlice: StateCreator<
  ProviderSlice,
  [],
  [],
  ProviderSlice
> = (set, get) => ({
  // Initial state
  clinicians: [],
  selectedClinician: null,
  providerCredentialing: {},
  providerEnrollment: {},
  providerSchedules: {},
  serviceLocations: [],
  encounters: [],
  appointments: [],
  referrals: [],

  // Loading states
  cliniciansLoading: false,
  providerCredentialingLoading: false,
  providerEnrollmentLoading: false,
  providerSchedulesLoading: false,
  serviceLocationsLoading: false,
  encountersLoading: false,
  appointmentsLoading: false,

  // Error states
  cliniciansError: null,
  providerCredentialingError: null,
  providerEnrollmentError: null,

  // Filter state
  providerFilters: {
    activeOnly: true,
  },

  // Clinicians actions
  setClinicians: (clinicians) => set({ clinicians }),
  setSelectedClinician: (clinician) => set({ selectedClinician: clinician }),

  addClinician: (clinician) =>
    set((state) => ({
      clinicians: [...state.clinicians, clinician],
    })),

  updateClinician: (id, updates) =>
    set((state) => ({
      clinicians: state.clinicians.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      selectedClinician:
        state.selectedClinician?.id === id
          ? { ...state.selectedClinician, ...updates }
          : state.selectedClinician,
    })),

  removeClinician: (id) =>
    set((state) => ({
      clinicians: state.clinicians.filter((c) => c.id !== id),
      selectedClinician:
        state.selectedClinician?.id === id ? null : state.selectedClinician,
    })),

  // Provider credentialing actions
  setProviderCredentialing: (clinicianId, credentialing) =>
    set((state) => ({
      providerCredentialing: {
        ...state.providerCredentialing,
        [clinicianId]: credentialing,
      },
    })),

  addProviderCredentialing: (credentialing) =>
    set((state) => {
      const clinicianId = credentialing.clinicianId;
      const currentCredentialing =
        state.providerCredentialing[clinicianId] || [];
      return {
        providerCredentialing: {
          ...state.providerCredentialing,
          [clinicianId]: [...currentCredentialing, credentialing],
        },
      };
    }),

  updateProviderCredentialing: (id, updates) =>
    set((state) => {
      const newCredentialing = { ...state.providerCredentialing };
      Object.keys(newCredentialing).forEach((clinicianId) => {
        newCredentialing[parseInt(clinicianId)] = newCredentialing[
          parseInt(clinicianId)
        ].map((c) => (c.id === id ? { ...c, ...updates } : c));
      });
      return { providerCredentialing: newCredentialing };
    }),

  removeProviderCredentialing: (id) =>
    set((state) => {
      const newCredentialing = { ...state.providerCredentialing };
      Object.keys(newCredentialing).forEach((clinicianId) => {
        newCredentialing[parseInt(clinicianId)] = newCredentialing[
          parseInt(clinicianId)
        ].filter((c) => c.id !== id);
      });
      return { providerCredentialing: newCredentialing };
    }),

  // Provider enrollment actions
  setProviderEnrollment: (clinicianId, enrollment) =>
    set((state) => ({
      providerEnrollment: {
        ...state.providerEnrollment,
        [clinicianId]: enrollment,
      },
    })),

  addProviderEnrollment: (enrollment) =>
    set((state) => {
      const clinicianId = enrollment.clinicianId;
      const currentEnrollment = state.providerEnrollment[clinicianId] || [];
      return {
        providerEnrollment: {
          ...state.providerEnrollment,
          [clinicianId]: [...currentEnrollment, enrollment],
        },
      };
    }),

  updateProviderEnrollment: (id, updates) =>
    set((state) => {
      const newEnrollment = { ...state.providerEnrollment };
      Object.keys(newEnrollment).forEach((clinicianId) => {
        newEnrollment[parseInt(clinicianId)] = newEnrollment[
          parseInt(clinicianId)
        ].map((e) => (e.id === id ? { ...e, ...updates } : e));
      });
      return { providerEnrollment: newEnrollment };
    }),

  removeProviderEnrollment: (id) =>
    set((state) => {
      const newEnrollment = { ...state.providerEnrollment };
      Object.keys(newEnrollment).forEach((clinicianId) => {
        newEnrollment[parseInt(clinicianId)] = newEnrollment[
          parseInt(clinicianId)
        ].filter((e) => e.id !== id);
      });
      return { providerEnrollment: newEnrollment };
    }),

  // Provider schedules actions
  setProviderSchedules: (clinicianId, schedules) =>
    set((state) => ({
      providerSchedules: {
        ...state.providerSchedules,
        [clinicianId]: schedules,
      },
    })),

  addProviderSchedule: (schedule) =>
    set((state) => {
      const clinicianId = schedule.clinicianId;
      const currentSchedules = state.providerSchedules[clinicianId] || [];
      return {
        providerSchedules: {
          ...state.providerSchedules,
          [clinicianId]: [...currentSchedules, schedule],
        },
      };
    }),

  updateProviderSchedule: (id, updates) =>
    set((state) => {
      const newSchedules = { ...state.providerSchedules };
      Object.keys(newSchedules).forEach((clinicianId) => {
        newSchedules[parseInt(clinicianId)] = newSchedules[
          parseInt(clinicianId)
        ].map((s) => (s.id === id ? { ...s, ...updates } : s));
      });
      return { providerSchedules: newSchedules };
    }),

  removeProviderSchedule: (id) =>
    set((state) => {
      const newSchedules = { ...state.providerSchedules };
      for (const clinicianId of Object.keys(newSchedules)) {
        newSchedules[Number.parseInt(clinicianId)] = newSchedules[
          Number.parseInt(clinicianId)
        ].filter((s) => s.id !== id);
      }
      return { providerSchedules: newSchedules };
    }),

  // Service locations actions
  setServiceLocations: (locations) => set({ serviceLocations: locations }),

  addServiceLocation: (location) =>
    set((state) => ({
      serviceLocations: [...state.serviceLocations, location],
    })),

  updateServiceLocation: (id, updates) =>
    set((state) => ({
      serviceLocations: state.serviceLocations.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  removeServiceLocation: (id) =>
    set((state) => ({
      serviceLocations: state.serviceLocations.filter((l) => l.id !== id),
    })),

  // Encounters actions
  setEncounters: (encounters) => set({ encounters }),

  addEncounter: (encounter) =>
    set((state) => ({
      encounters: [...state.encounters, encounter],
    })),

  updateEncounter: (id, updates) =>
    set((state) => ({
      encounters: state.encounters.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  removeEncounter: (id) =>
    set((state) => ({
      encounters: state.encounters.filter((e) => e.id !== id),
    })),

  // Appointments actions
  setAppointments: (appointments) => set({ appointments }),

  addAppointment: (appointment) =>
    set((state) => ({
      appointments: [...state.appointments, appointment],
    })),

  updateAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  removeAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((a) => a.id !== id),
    })),

  // Referrals actions
  setReferrals: (referrals) => set({ referrals }),

  addReferral: (referral) =>
    set((state) => ({
      referrals: [...state.referrals, referral],
    })),

  updateReferral: (id, updates) =>
    set((state) => ({
      referrals: state.referrals.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  removeReferral: (id) =>
    set((state) => ({
      referrals: state.referrals.filter((r) => r.id !== id),
    })),

  // Filter actions
  setProviderFilters: (filters) =>
    set((state) => ({
      providerFilters: { ...state.providerFilters, ...filters },
    })),

  clearProviderFilters: () =>
    set({
      providerFilters: {
        activeOnly: true,
      },
    }),

  // Async actions - converted to API-based fetching
  fetchClinicians: async () => {
    set({ cliniciansLoading: true, cliniciansError: null });
    try {
      const response = await fetch('/api/clinicians');
      if (!response.ok) {
        throw new Error('Failed to fetch clinicians');
      }
      const data = await response.json();
      set({ clinicians: data || [], cliniciansLoading: false });
    } catch (error) {
      set({
        cliniciansError:
          error instanceof Error ? error.message : "Failed to fetch clinicians",
        cliniciansLoading: false,
      });
    }
  },

  fetchClinicianById: async (id) => {
    try {
      const response = await fetch(`/api/clinicians/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch clinician');
      }
      const data = await response.json();
      if (data) {
        get().setSelectedClinician(data);
        // Also update in clinicians array if it exists
        const clinicians = get().clinicians;
        const existingIndex = clinicians.findIndex((c) => c.id === id);
        if (existingIndex >= 0) {
          get().updateClinician(id, data);
        } else {
          get().addClinician(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch clinician:", error);
    }
  },

  fetchProviderCredentialing: async (clinicianId) => {
    set({
      providerCredentialingLoading: true,
      providerCredentialingError: null,
    });
    try {
      const response = await fetch(`/api/clinicians/${clinicianId}/credentialing`);
      if (!response.ok) {
        throw new Error('Failed to fetch provider credentialing');
      }
      const data = await response.json();
      get().setProviderCredentialing(clinicianId, data || []);
      set({ providerCredentialingLoading: false });
    } catch (error) {
      set({
        providerCredentialingError:
          error instanceof Error
            ? error.message
            : "Failed to fetch provider credentialing",
        providerCredentialingLoading: false,
      });
    }
  },

  fetchProviderEnrollment: async (clinicianId) => {
    set({ providerEnrollmentLoading: true, providerEnrollmentError: null });
    try {
      const response = await fetch(`/api/clinicians/${clinicianId}/enrollment`);
      if (!response.ok) {
        throw new Error('Failed to fetch provider enrollment');
      }
      const data = await response.json();
      get().setProviderEnrollment(clinicianId, data || []);
      set({ providerEnrollmentLoading: false });
    } catch (error) {
      set({
        providerEnrollmentError:
          error instanceof Error
            ? error.message
            : "Failed to fetch provider enrollment",
        providerEnrollmentLoading: false,
      });
    }
  },

  fetchProviderSchedules: async (clinicianId) => {
    set({ providerSchedulesLoading: true });
    try {
      const response = await fetch(`/api/clinicians/${clinicianId}/schedules`);
      if (!response.ok) {
        throw new Error('Failed to fetch provider schedules');
      }
      const data = await response.json();
      get().setProviderSchedules(clinicianId, data || []);
      set({ providerSchedulesLoading: false });
    } catch {
      set({ providerSchedulesLoading: false });
    }
  },

  fetchServiceLocations: async () => {
    set({ serviceLocationsLoading: true });
    try {
      const response = await fetch('/api/service-locations');
      if (!response.ok) {
        throw new Error('Failed to fetch service locations');
      }
      const data = await response.json();
      set({ serviceLocations: data || [], serviceLocationsLoading: false });
    } catch {
      set({ serviceLocationsLoading: false });
    }
  },

  fetchEncounters: async () => {
    set({ encountersLoading: true });
    try {
      const response = await fetch('/api/encounters');
      if (!response.ok) {
        throw new Error('Failed to fetch encounters');
      }
      const data = await response.json();
      set({ encounters: data || [], encountersLoading: false });
    } catch {
      set({ encountersLoading: false });
    }
  },

  fetchAppointments: async () => {
    set({ appointmentsLoading: true });
    try {
      const response = await fetch('/api/appointments');
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      set({ appointments: data || [], appointmentsLoading: false });
    } catch {
      set({ appointmentsLoading: false });
    }
  },

  fetchReferrals: async () => {
    try {
      const response = await fetch('/api/referrals');
      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }
      const data = await response.json();
      set({ referrals: data || [] });
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
    }
  },

  createEncounter: async (encounterData) => {
    try {
      const response = await fetch('/api/encounters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(encounterData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create encounter');
      }
      
      const data = await response.json();
      if (data) {
        get().addEncounter(data);
      }
    } catch (error) {
      console.error("Failed to create encounter:", error);
      throw error;
    }
  },

  scheduleAppointment: async (appointmentData) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule appointment');
      }
      
      const data = await response.json();
      if (data) {
        get().addAppointment(data);
      }
    } catch (error) {
      console.error("Failed to schedule appointment:", error);
      throw error;
    }
  },
});
