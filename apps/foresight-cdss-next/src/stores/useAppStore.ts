// stores/useAppStore.ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Tables } from "@/types/database.types";
import { RealtimeChannel } from "@supabase/supabase-js";

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
  subscriptions: Set<RealtimeChannel>;

  // Actions
  setCurrentTeam: (team: Tables<"team">) => void;
  setActiveFilters: (type: "claims" | "pa", filters: any) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer((set) => ({
      currentTeam: null,
      teamMember: null,
      sidebarOpen: true,
      activeWorkQueue: null,
      activeClaimFilters: {},
      activePAFilters: {},
      selectedPatientId: null,
      subscriptions: new Set(),

      setCurrentTeam: (team) =>
        set((state) => {
          state.currentTeam = team;
        }),

      setActiveFilters: (type, filters) =>
        set((state) => {
          if (type === "claims") {
            state.activeClaimFilters = filters;
          } else {
            state.activePAFilters = filters;
          }
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),
    }))
  )
);
