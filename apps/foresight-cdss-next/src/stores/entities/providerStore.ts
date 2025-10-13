import { StateCreator } from "zustand";
import type { Tables } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export interface ProviderSlice {
  // State
  clinicians: Tables<"clinician">[];
  selectedClinician: Tables<"clinician"> | null;
  providerCredentialing: Record<number, Tables<"provider_credentialing">[]>;
  providerEnrollment: Record<number, Tables<"provider_enrollment">[]>;
  providerSchedules: Record<number, Tables<"provider_schedule">[]>;
  serviceLocations: Tables<"service_location">[];
  encounters: Tables<"encounter">[];
  appointments: Tables<"appointment">[];
  referrals: Tables<"referral">[];

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
  setClinicians: (clinicians: Tables<"clinician">[]) => void;
  setSelectedClinician: (clinician: Tables<"clinician"> | null) => void;
  addClinician: (clinician: Tables<"clinician">) => void;
  updateClinician: (id: number, updates: Partial<Tables<"clinician">>) => void;
  removeClinician: (id: number) => void;

  // Provider credentialing actions
  setProviderCredentialing: (
    clinicianId: number,
    credentialing: Tables<"provider_credentialing">[]
  ) => void;
  addProviderCredentialing: (
    credentialing: Tables<"provider_credentialing">
  ) => void;
  updateProviderCredentialing: (
    id: string,
    updates: Partial<Tables<"provider_credentialing">>
  ) => void;
  removeProviderCredentialing: (id: string) => void;

  // Provider enrollment actions
  setProviderEnrollment: (
    clinicianId: number,
    enrollment: Tables<"provider_enrollment">[]
  ) => void;
  addProviderEnrollment: (enrollment: Tables<"provider_enrollment">) => void;
  updateProviderEnrollment: (
    id: string,
    updates: Partial<Tables<"provider_enrollment">>
  ) => void;
  removeProviderEnrollment: (id: string) => void;

  // Provider schedules actions
  setProviderSchedules: (
    clinicianId: number,
    schedules: Tables<"provider_schedule">[]
  ) => void;
  addProviderSchedule: (schedule: Tables<"provider_schedule">) => void;
  updateProviderSchedule: (
    id: string,
    updates: Partial<Tables<"provider_schedule">>
  ) => void;
  removeProviderSchedule: (id: string) => void;

  // Service locations actions
  setServiceLocations: (locations: Tables<"service_location">[]) => void;
  addServiceLocation: (location: Tables<"service_location">) => void;
  updateServiceLocation: (
    id: string,
    updates: Partial<Tables<"service_location">>
  ) => void;
  removeServiceLocation: (id: string) => void;

  // Encounters actions
  setEncounters: (encounters: Tables<"encounter">[]) => void;
  addEncounter: (encounter: Tables<"encounter">) => void;
  updateEncounter: (id: string, updates: Partial<Tables<"encounter">>) => void;
  removeEncounter: (id: string) => void;

  // Appointments actions
  setAppointments: (appointments: Tables<"appointment">[]) => void;
  addAppointment: (appointment: Tables<"appointment">) => void;
  updateAppointment: (
    id: string,
    updates: Partial<Tables<"appointment">>
  ) => void;
  removeAppointment: (id: string) => void;

  // Referrals actions
  setReferrals: (referrals: Tables<"referral">[]) => void;
  addReferral: (referral: Tables<"referral">) => void;
  updateReferral: (id: string, updates: Partial<Tables<"referral">>) => void;
  removeReferral: (id: string) => void;

  // Filter actions
  setProviderFilters: (filters: ProviderSlice["providerFilters"]) => void;
  clearProviderFilters: () => void;

  // Async actions
  fetchClinicians: () => Promise<void>;
  fetchClinicianById: (id: number) => Promise<void>;
  fetchProviderCredentialing: (clinicianId: number) => Promise<void>;
  fetchProviderEnrollment: (clinicianId: number) => Promise<void>;
  fetchProviderSchedules: (clinicianId: number) => Promise<void>;
  fetchServiceLocations: () => Promise<void>;
  fetchEncounters: () => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchReferrals: () => Promise<void>;
  createEncounter: (encounterData: any) => Promise<void>;
  scheduleAppointment: (appointmentData: any) => Promise<void>;
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
      const clinicianId = credentialing.clinician_id;
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
      const clinicianId = Number(enrollment.clinician_id);
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
      const clinicianId = Number(schedule.provider_id);
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

  // Async actions
  fetchClinicians: async () => {
    set({ cliniciansLoading: true, cliniciansError: null });
    try {
      const { data, error } = await supabase
        .from("clinician")
        .select("*")
        .order("last_name", { ascending: true });

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("clinician")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("provider_credentialing")
        .select("*")
        .eq("clinician_id", clinicianId);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("provider_enrollment")
        .select("*")
        .eq("clinician_id", clinicianId);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("provider_schedule")
        .select("*")
        .eq("clinician_id", clinicianId);

      if (error) throw error;
      get().setProviderSchedules(clinicianId, data || []);
      set({ providerSchedulesLoading: false });
    } catch (error) {
      set({ providerSchedulesLoading: false });
    }
  },

  fetchServiceLocations: async () => {
    set({ serviceLocationsLoading: true });
    try {
      const { data, error } = await supabase
        .from("service_location")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      set({ serviceLocations: data || [], serviceLocationsLoading: false });
    } catch (error) {
      set({ serviceLocationsLoading: false });
    }
  },

  fetchEncounters: async () => {
    set({ encountersLoading: true });
    try {
      const { data, error } = await supabase
        .from("encounter")
        .select("*")
        .order("encounter_date", { ascending: false });

      if (error) throw error;
      set({ encounters: data || [], encountersLoading: false });
    } catch (error) {
      set({ encountersLoading: false });
    }
  },

  fetchAppointments: async () => {
    set({ appointmentsLoading: true });
    try {
      const { data, error } = await supabase
        .from("appointment")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      set({ appointments: data || [], appointmentsLoading: false });
    } catch (error) {
      set({ appointmentsLoading: false });
    }
  },

  fetchReferrals: async () => {
    try {
      const { data, error } = await supabase
        .from("referral")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ referrals: data || [] });
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
    }
  },

  createEncounter: async (encounterData) => {
    try {
      const { data, error } = await supabase
        .from("encounter")
        .insert([encounterData])
        .select()
        .single();

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("appointment")
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        get().addAppointment(data);
      }
    } catch (error) {
      console.error("Failed to schedule appointment:", error);
      throw error;
    }
  },
});
