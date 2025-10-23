import { create } from "zustand";
import { Tables } from "@/types/database.types";
import { ClaimFilters, PAFilters } from "@/stores/types";

// AWS EventBridge subscription for real-time updates
interface EventBridgeSubscription {
  id: string;
  eventSource: string;
  detailType: string;
  handler: (event: any) => void;
  active: boolean;
}

interface AppState {
  // User & Team
  currentTeam: Tables<"team"> | null;
  teamMember: Tables<"team_member"> | null;

  // UI State
  sidebarOpen: boolean;
  activeWorkQueue: string | null;

  // Workflow State
  activeClaimFilters: ClaimFilters;
  activePAFilters: PAFilters;
  selectedPatientId: number | null;

  // Real-time subscriptions
  subscriptions: Set<EventBridgeSubscription>;

  // Actions
  setCurrentTeam: (team: Tables<"team">) => void;
  setActiveFilters: (type: "claims" | "pa", filters: ClaimFilters | PAFilters) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentTeam: null,
  teamMember: null,
  sidebarOpen: true,
  activeWorkQueue: null,
  activeClaimFilters: {},
  activePAFilters: {},
  selectedPatientId: null,
  subscriptions: new Set(),

  setCurrentTeam: (team: Tables<"team">) =>
    set((state) => ({ ...state, currentTeam: team })),

  setActiveFilters: (type: "claims" | "pa", filters: ClaimFilters | PAFilters) =>
    set((state) => ({
      ...state,
      ...(type === "claims" 
        ? { activeClaimFilters: filters as ClaimFilters }
        : { activePAFilters: filters as PAFilters }
      )
    })),

  toggleSidebar: () =>
    set((state) => ({ ...state, sidebarOpen: !state.sidebarOpen })),
}));
