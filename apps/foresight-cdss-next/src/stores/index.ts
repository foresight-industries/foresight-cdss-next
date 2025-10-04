// stores/index.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { supabase } from "@/lib/supabase";
import { SessionState } from "node:http2";

// Separate stores by domain
export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      immer((set) => ({
        currentTeam: null,
        teamMember: null,
        permissions: [],

        setSession: (data) =>
          set((state) => {
            state.currentTeam = data.team;
            state.teamMember = data.member;
            state.permissions = data.permissions;
          }),
      })),
      { name: "rcm-session" }
    )
  )
);

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    immer((set, get) => ({
      // Claims workflow
      activeClaimWorkflow: null,
      claimFilters: {
        status: ["submitted", "in_review"],
        payer: null,
        dateRange: "last_30_days",
      },

      // PA workflow
      activePAWorkflow: null,
      paQueue: [],

      // Denial management
      denialWorkList: [],

      // Actions with business logic
      startClaimWorkflow: (claimId: string) =>
        set((state) => {
          state.activeClaimWorkflow = {
            claimId,
            startedAt: new Date(),
            currentStep: "validation",
          };
        }),

      // Complex async workflows
      async processNextDenial() {
        const { denialWorkList } = get();
        const next = denialWorkList[0];

        if (!next) return;

        const result = await supabase
          .from("denial_tracking")
          .update({ status: "in_review" })
          .eq("id", next.id);

        set((state) => {
          state.denialWorkList.shift();
        });

        return result;
      },
    }))
  )
);

// UI-only store (not persisted)
export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  activeModal: null,
  notifications: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  showNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),
}));
