import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Import all slices
import { createPatientSlice, PatientSlice } from "./entities/patientStore";
import { ClaimSlice, createClaimSlice } from "./entities/claimStore";
import {
  createPriorAuthSlice,
  PriorAuthSlice,
} from "./entities/priorAuthStore";
import { createPaymentSlice, PaymentSlice } from "./entities/paymentStore";
import { createProviderSlice, ProviderSlice } from "./entities/providerStore";
import { createPayerSlice, PayerSlice } from "./entities/payerStore";
import { AdminSlice, createAdminSlice } from "./entities/adminStore";

// Combined store type
export type AppStore = PatientSlice &
  ClaimSlice &
  PriorAuthSlice &
  PaymentSlice &
  ProviderSlice &
  PayerSlice &
  AdminSlice & {
    // Global UI state
    globalLoading: boolean;
    globalError: string | null;

    // Navigation state
    currentView:
      | "dashboard"
      | "patients"
      | "claims"
      | "prior-auth"
      | "payments"
      | "providers"
      | "admin";
    breadcrumbs: Array<{ label: string; href?: string }>;

    // Multi-entity selection
    selectedEntityType:
      | "patient"
      | "claim"
      | "prior-auth"
      | "payment"
      | "provider"
      | null;
    selectedEntityIds: Set<string | number>;

    // Bulk operations
    bulkOperationMode: boolean;
    bulkOperationType: "update" | "delete" | "export" | null;

    // Real-time updates
    realtimeConnected: boolean;
    realtimeLastUpdate: Date | null;

    // Global actions
    setGlobalLoading: (loading: boolean) => void;
    setGlobalError: (error: string | null) => void;
    setCurrentView: (view: AppStore["currentView"]) => void;
    setBreadcrumbs: (breadcrumbs: AppStore["breadcrumbs"]) => void;

    // Multi-entity selection actions
    setSelectedEntityType: (type: AppStore["selectedEntityType"]) => void;
    toggleEntitySelection: (id: string | number) => void;
    selectAllEntities: (ids: (string | number)[]) => void;
    clearEntitySelection: () => void;

    // Bulk operations actions
    setBulkOperationMode: (enabled: boolean) => void;
    setBulkOperationType: (type: AppStore["bulkOperationType"]) => void;
    executeBulkOperation: () => Promise<void>;

    // Real-time actions
    setRealtimeConnected: (connected: boolean) => void;
    updateRealtimeTimestamp: () => void;

    // Utility actions
    resetAllStores: () => void;
    exportData: (
      entityType: string,
      format: "json" | "csv" | "xlsx"
    ) => Promise<void>;
  };

// Create the main store
const createMainStore = create<AppStore>()(
  subscribeWithSelector(
    devtools(
      immer((set, get, store) => {
        // Create individual slice setters that work with the combined store
        const createSliceSetter =
          () => (partial: any, replace?: boolean | undefined) => {
            if (replace === true) {
              set(partial, true);
            } else {
              set(partial, replace);
            }
          };

        return {
          // Combine all slices
          ...createPatientSlice(createSliceSetter(), get as any, {} as any),
          ...createClaimSlice(createSliceSetter(), get as any, {} as any),
          ...createPriorAuthSlice(createSliceSetter(), get as any, {} as any),
          ...createPaymentSlice(createSliceSetter(), get as any, {} as any),
          ...createProviderSlice(createSliceSetter(), get as any, {} as any),
          ...createPayerSlice(createSliceSetter(), get as any, {} as any),
          ...createAdminSlice(createSliceSetter(), get as any, {} as any),

          // Global state
          globalLoading: false,
          globalError: null,

          // Navigation state
          currentView: "dashboard",
          breadcrumbs: [],

          // Multi-entity selection
          selectedEntityType: null,
          selectedEntityIds: new Set(),

          // Bulk operations
          bulkOperationMode: false,
          bulkOperationType: null,

          // Real-time updates
          realtimeConnected: false,
          realtimeLastUpdate: null,

          // Global actions
          setGlobalLoading: (loading) => {
            set((state) => {
              state.globalLoading = loading;
            });
          },

          setGlobalError: (error) => {
            set((state) => {
              state.globalError = error;
            });
          },

          setCurrentView: (view) => {
            set((state) => {
              state.currentView = view;
            });
          },

          setBreadcrumbs: (breadcrumbs) => {
            set((state) => {
              state.breadcrumbs = breadcrumbs;
            });
          },

          // Multi-entity selection actions
          setSelectedEntityType: (type) => {
            set((state) => {
              state.selectedEntityType = type;
              state.selectedEntityIds = new Set(); // Clear selection when changing type
            });
          },

          toggleEntitySelection: (id) => {
            set((state) => {
              const newSet = new Set(state.selectedEntityIds);
              if (newSet.has(id)) {
                newSet.delete(id);
              } else {
                newSet.add(id);
              }
              state.selectedEntityIds = newSet;
            });
          },

          selectAllEntities: (ids) => {
            set((state) => {
              state.selectedEntityIds = new Set(ids);
            });
          },

          clearEntitySelection: () => {
            set((state) => {
              state.selectedEntityIds = new Set();
            });
          },

          // Bulk operations actions
          setBulkOperationMode: (enabled) => {
            set((state) => {
              state.bulkOperationMode = enabled;
              if (!enabled) {
                state.selectedEntityIds = new Set();
                state.bulkOperationType = null;
              }
            });
          },

          setBulkOperationType: (type) => {
            set((state) => {
              state.bulkOperationType = type;
            });
          },

          executeBulkOperation: async () => {
            const state = get();
            const { selectedEntityType, selectedEntityIds, bulkOperationType } =
              state;

            if (
              !selectedEntityType ||
              !bulkOperationType ||
              selectedEntityIds.size === 0
            ) {
              return;
            }

            try {
              state.setGlobalLoading(true);

              // Execute bulk operation based on type and entity
              switch (bulkOperationType) {
                case "delete":
                  // Implement bulk delete logic for each entity type
                  if (selectedEntityType === "patient") {
                    // Bulk delete patients
                    for (const id of selectedEntityIds) {
                      state.removePatient(id as number);
                    }
                  } else if (selectedEntityType === "claim") {
                    // Bulk delete claims
                    for (const id of selectedEntityIds) {
                      state.removeClaim(id as string);
                    }
                  }
                  // Add other entity types as needed
                  break;

                case "export":
                  // Implement bulk export logic
                  await state.exportData(selectedEntityType, "csv");
                  break;

                case "update":
                  // Implement bulk update logic
                  // This would typically show a modal for bulk updates
                  break;
              }

              // Clear selection after operation
              state.clearEntitySelection();
              state.setBulkOperationMode(false);
            } catch (error) {
              state.setGlobalError(
                error instanceof Error ? error.message : "Bulk operation failed"
              );
            } finally {
              state.setGlobalLoading(false);
            }
          },

          // Real-time actions
          setRealtimeConnected: (connected) => {
            set((state) => {
              state.realtimeConnected = connected;
            });
          },

          updateRealtimeTimestamp: () => {
            set((state) => {
              state.realtimeLastUpdate = new Date();
            });
          },

          // Utility actions
          resetAllStores: () => {
            set((state) => {
              // Reset all entity stores to initial state
              state.patients = [];
              state.selectedPatient = null;
              state.claims = [];
              state.selectedClaim = null;
              state.priorAuths = [];
              state.selectedPriorAuth = null;
              state.paymentDetails = [];
              state.clinicians = [];
              state.selectedClinician = null;
              state.payers = [];
              state.selectedPayer = null;
              state.teams = [];

              // Reset global state
              state.globalLoading = false;
              state.globalError = null;
              state.selectedEntityIds = new Set();
              state.bulkOperationMode = false;
              state.bulkOperationType = null;
            });
          },

          exportData: async (entityType, format) => {
            const state = get();

            try {
              state.setGlobalLoading(true);

              let data: any[] = [];

              // Get data based on entity type
              switch (entityType) {
                case "patient":
                  data = state.patients;
                  break;
                case "claim":
                  data = state.claims;
                  break;
                case "prior-auth":
                  data = state.priorAuths;
                  break;
                case "payment":
                  data = state.paymentDetails;
                  break;
                case "provider":
                  data = state.clinicians;
                  break;
                case "payer":
                  data = state.payers;
                  break;
                default:
                  throw new Error("Unsupported entity type for export");
              }

              // Filter by selected IDs if in bulk mode
              if (state.bulkOperationMode && state.selectedEntityIds.size > 0) {
                data = data.filter((item) =>
                  state.selectedEntityIds.has(item.id)
                );
              }

              // Export logic would go here (convert to CSV, JSON, etc.)
              const exportData = JSON.stringify(data, null, 2);

              // Create download
              const blob = new Blob([exportData], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${entityType}-export-${
                new Date().toISOString().split("T")[0]
              }.${format}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            } catch (error) {
              state.setGlobalError(
                error instanceof Error ? error.message : "Export failed"
              );
            } finally {
              state.setGlobalLoading(false);
            }
          },
        };
      }),
      {
        name: "foresight-cdss-store",
        partialize: (state: AppStore) => ({
          // Only persist certain parts of the state
          currentView: state.currentView,
          breadcrumbs: state.breadcrumbs,
          // Don't persist sensitive data or temporary UI state
        }),
      }
    )
  )
);

export const useAppStore = createMainStore;

// Export individual slice selectors for performance
export const usePatientStore = () =>
  useAppStore((state) => ({
    patients: state.patients,
    selectedPatient: state.selectedPatient,
    patientProfiles: state.patientProfiles,
    patientsLoading: state.patientsLoading,
    patientsError: state.patientsError,
    fetchPatients: state.fetchPatients,
    setSelectedPatient: state.setSelectedPatient,
    addPatient: state.addPatient,
    updatePatient: state.updatePatient,
    removePatient: state.removePatient,
  }));

export const useClaimStore = () =>
  useAppStore((state) => ({
    claims: state.claims,
    selectedClaim: state.selectedClaim,
    claimLines: state.claimLines,
    claimsLoading: state.claimsLoading,
    claimsError: state.claimsError,
    fetchClaims: state.fetchClaims,
    setSelectedClaim: state.setSelectedClaim,
    addClaim: state.addClaim,
    updateClaim: state.updateClaim,
    removeClaim: state.removeClaim,
  }));

export const usePriorAuthStore = () =>
  useAppStore((state) => ({
    priorAuths: state.priorAuths,
    selectedPriorAuth: state.selectedPriorAuth,
    priorAuthsLoading: state.priorAuthsLoading,
    priorAuthsError: state.priorAuthsError,
    fetchPriorAuths: state.fetchPriorAuths,
    setSelectedPriorAuth: state.setSelectedPriorAuth,
    addPriorAuth: state.addPriorAuth,
    updatePriorAuth: state.updatePriorAuth,
    removePriorAuth: state.removePriorAuth,
  }));

export const usePaymentStore = () =>
  useAppStore((state) => ({
    paymentDetails: state.paymentDetails,
    paymentAdjustments: state.paymentAdjustments,
    paymentPlans: state.paymentPlans,
    paymentDetailsLoading: state.paymentDetailsLoading,
    paymentDetailsError: state.paymentDetailsError,
    fetchPaymentDetails: state.fetchPaymentDetails,
    addPaymentDetail: state.addPaymentDetail,
    updatePaymentDetail: state.updatePaymentDetail,
    removePaymentDetail: state.removePaymentDetail,
  }));

export const useProviderStore = () =>
  useAppStore((state) => ({
    clinicians: state.clinicians,
    selectedClinician: state.selectedClinician,
    encounters: state.encounters,
    appointments: state.appointments,
    cliniciansLoading: state.cliniciansLoading,
    cliniciansError: state.cliniciansError,
    fetchClinicians: state.fetchClinicians,
    setSelectedClinician: state.setSelectedClinician,
    addClinician: state.addClinician,
    updateClinician: state.updateClinician,
    removeClinician: state.removeClinician,
  }));

export const usePayerStore = () =>
  useAppStore((state) => ({
    payers: state.payers,
    selectedPayer: state.selectedPayer,
    insurancePolicies: state.insurancePolicies,
    payersLoading: state.payersLoading,
    payersError: state.payersError,
    fetchPayers: state.fetchPayers,
    setSelectedPayer: state.setSelectedPayer,
    addPayer: state.addPayer,
    updatePayer: state.updatePayer,
    removePayer: state.removePayer,
  }));

export const useAdminStore = () =>
  useAppStore((state) => ({
    teams: state.teams,
    teamMembers: state.teamMembers,
    userProfiles: state.userProfiles,
    teamsLoading: state.teamsLoading,
    teamsError: state.teamsError,
    fetchTeams: state.fetchTeams,
    fetchTeamMembers: state.fetchTeamMembers,
    addTeam: state.addTeam,
    updateTeam: state.updateTeam,
    removeTeam: state.removeTeam,
  }));

// Global state selectors
export const useGlobalState = () =>
  useAppStore((state) => ({
    globalLoading: state.globalLoading,
    globalError: state.globalError,
    currentView: state.currentView,
    breadcrumbs: state.breadcrumbs,
    realtimeConnected: state.realtimeConnected,
    setGlobalLoading: state.setGlobalLoading,
    setGlobalError: state.setGlobalError,
    setCurrentView: state.setCurrentView,
    setBreadcrumbs: state.setBreadcrumbs,
  }));

// Bulk operations selectors
export const useBulkOperations = () =>
  useAppStore((state) => ({
    selectedEntityType: state.selectedEntityType,
    selectedEntityIds: state.selectedEntityIds,
    bulkOperationMode: state.bulkOperationMode,
    bulkOperationType: state.bulkOperationType,
    setSelectedEntityType: state.setSelectedEntityType,
    toggleEntitySelection: state.toggleEntitySelection,
    selectAllEntities: state.selectAllEntities,
    clearEntitySelection: state.clearEntitySelection,
    setBulkOperationMode: state.setBulkOperationMode,
    setBulkOperationType: state.setBulkOperationType,
    executeBulkOperation: state.executeBulkOperation,
  }));
