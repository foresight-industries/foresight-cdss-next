// stores/workflowStore.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { ENABLE_DEVTOOLS } from "./config";
import type { ClaimFilters, PAFilters, WorkflowStep } from "./types";
import { devtools } from "zustand/middleware";

interface WorkflowState {
  // Claims Workflow
  activeClaimWorkflow: {
    claimId: string;
    startedAt: Date;
    currentStep: string;
    steps: WorkflowStep[];
    context: Record<string, any>;
  } | null;

  claimFilters: ClaimFilters;
  selectedClaimIds: Set<string>;

  // Prior Auth Workflow
  activePAWorkflow: {
    paId: string;
    startedAt: Date;
    currentStep: string;
    steps: WorkflowStep[];
    clinicalData: Record<string, any>;
  } | null;

  paFilters: PAFilters;
  paQueue: string[];

  // Denial Management
  denialWorkList: Array<{
    id: string;
    claimId: string;
    priority: number;
    deadline: Date;
  }>;
  activeDenialId: string | null;

  // Actions
  startClaimWorkflow: (claimId: string) => void;
  updateClaimWorkflowStep: (
    stepId: string,
    data: Partial<WorkflowStep>
  ) => void;
  completeClaimWorkflow: () => void;

  startPAWorkflow: (paId: string) => void;
  updatePAWorkflowStep: (stepId: string, data: Partial<WorkflowStep>) => void;
  completePAWorkflow: () => void;

  setClaimFilters: (filters: ClaimFilters) => void;
  setPAFilters: (filters: PAFilters) => void;

  toggleClaimSelection: (claimId: string) => void;
  clearClaimSelection: () => void;

  addToDenialWorkList: (denial: WorkflowState["denialWorkList"][0]) => void;
  removeFromDenialWorkList: (denialId: string) => void;
  setActiveDenial: (denialId: string | null) => void;
}

// Store implementation without exposing PHI
const storeImplementation = (set: any, get: any) => ({
  // Initial state
  activeClaimWorkflow: null,
  claimFilters: {
    status: ["submitted", "in_review"],
    dateRange: "last_30_days",
  },
  selectedClaimIds: new Set(),

  activePAWorkflow: null,
  paFilters: {
    status: ["pending_info", "ready_to_submit"],
  },
  paQueue: [],

  denialWorkList: [],
  activeDenialId: null,

  // Claim workflow actions
  startClaimWorkflow: (claimId) =>
    set((state) => {
      state.activeClaimWorkflow = {
        claimId,
        startedAt: new Date(),
        currentStep: "validation",
        steps: [
          { id: "validation", name: "Validation", status: "in_progress" },
          { id: "scrubbing", name: "Scrubbing", status: "pending" },
          { id: "review", name: "Review", status: "pending" },
          { id: "submission", name: "Submission", status: "pending" },
        ],
        context: {},
      };
    }),

  updateClaimWorkflowStep: (stepId, data) =>
    set((state) => {
      if (!state.activeClaimWorkflow) return;

      const step = state.activeClaimWorkflow.steps.find((s) => s.id === stepId);
      if (step) {
        Object.assign(step, data);

        // Auto-advance to next step
        if (data.status === "completed") {
          const currentIndex = state.activeClaimWorkflow.steps.findIndex(
            (s) => s.id === stepId
          );
          const nextStep = state.activeClaimWorkflow.steps[currentIndex + 1];
          if (nextStep) {
            state.activeClaimWorkflow.currentStep = nextStep.id;
            nextStep.status = "in_progress";
            nextStep.startedAt = new Date();
          }
        }
      }
    }),

  completeClaimWorkflow: () =>
    set((state) => {
      state.activeClaimWorkflow = null;
    }),

  // PA workflow actions
  startPAWorkflow: (paId) =>
    set((state) => {
      state.activePAWorkflow = {
        paId,
        startedAt: new Date(),
        currentStep: "eligibility",
        steps: [
          {
            id: "eligibility",
            name: "Eligibility Check",
            status: "in_progress",
          },
          { id: "clinical", name: "Clinical Review", status: "pending" },
          { id: "documentation", name: "Documentation", status: "pending" },
          { id: "submission", name: "Submission", status: "pending" },
        ],
        clinicalData: {},
      };
    }),

  updatePAWorkflowStep: (stepId, data) =>
    set((state) => {
      if (!state.activePAWorkflow) return;

      const step = state.activePAWorkflow.steps.find((s) => s.id === stepId);
      if (step) {
        Object.assign(step, data);

        if (data.status === "completed") {
          const currentIndex = state.activePAWorkflow.steps.findIndex(
            (s) => s.id === stepId
          );
          const nextStep = state.activePAWorkflow.steps[currentIndex + 1];
          if (nextStep) {
            state.activePAWorkflow.currentStep = nextStep.id;
            nextStep.status = "in_progress";
            nextStep.startedAt = new Date();
          }
        }
      }
    }),

  completePAWorkflow: () =>
    set((state) => {
      state.activePAWorkflow = null;
    }),

  // Filter actions
  setClaimFilters: (filters) =>
    set((state) => {
      state.claimFilters = filters;
    }),

  setPAFilters: (filters) =>
    set((state) => {
      state.paFilters = filters;
    }),

  // Selection actions
  toggleClaimSelection: (claimId) =>
    set((state) => {
      const newSet = new Set(state.selectedClaimIds);
      if (newSet.has(claimId)) {
        newSet.delete(claimId);
      } else {
        newSet.add(claimId);
      }
      state.selectedClaimIds = newSet;
    }),

  clearClaimSelection: () =>
    set((state) => {
      state.selectedClaimIds = new Set();
    }),

  // Denial management
  addToDenialWorkList: (denial) =>
    set((state) => {
      state.denialWorkList.push(denial);
      state.denialWorkList.sort((a, b) => b.priority - a.priority);
    }),

  removeFromDenialWorkList: (denialId) =>
    set((state) => {
      state.denialWorkList = state.denialWorkList.filter(
        (d) => d.id !== denialId
      );
    }),

  setActiveDenial: (denialId) =>
    set((state) => {
      state.activeDenialId = denialId;
    }),
});

const createStore = ENABLE_DEVTOOLS
  ? create<WorkflowState>()(devtools(immer(storeImplementation)))
  : create<WorkflowState>()(immer(storeImplementation));

export const useWorkflowStore = createStore;
