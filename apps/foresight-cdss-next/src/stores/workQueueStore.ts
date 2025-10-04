// stores/workQueueStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Tables } from "@/types/database";
import type { WorkQueueFilters } from "./types";

interface WorkQueueState {
  // Queue Management
  currentQueue: Tables<"work_queue">[];
  activeItem: Tables<"work_queue"> | null;
  filters: WorkQueueFilters;

  // Productivity Tracking
  sessionStats: {
    itemsCompleted: number;
    itemsSkipped: number;
    startTime: Date;
    avgCompletionTime: number;
  };

  // Batch Operations
  selectedItems: Set<string>;
  batchMode: boolean;

  // Actions
  setCurrentQueue: (items: Tables<"work_queue">[]) => void;
  setActiveItem: (item: Tables<"work_queue"> | null) => void;
  setFilters: (filters: WorkQueueFilters) => void;

  completeItem: (itemId: string, completionTime: number) => void;
  skipItem: (itemId: string) => void;

  toggleItemSelection: (itemId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setBatchMode: (enabled: boolean) => void;

  resetSessionStats: () => void;
}

export const useWorkQueueStore = create<WorkQueueState>()(
  devtools(
    immer((set) => ({
      currentQueue: [],
      activeItem: null,
      filters: {
        status: ["pending", "assigned", "in_progress"],
        priority: [1, 2, 3],
      },

      sessionStats: {
        itemsCompleted: 0,
        itemsSkipped: 0,
        startTime: new Date(),
        avgCompletionTime: 0,
      },

      selectedItems: new Set(),
      batchMode: false,

      setCurrentQueue: (items) =>
        set((state) => {
          state.currentQueue = items;
        }),

      setActiveItem: (item) =>
        set((state) => {
          state.activeItem = item;
        }),

      setFilters: (filters) =>
        set((state) => {
          state.filters = filters;
        }),

      completeItem: (itemId, completionTime) =>
        set((state) => {
          state.currentQueue = state.currentQueue.filter(
            (item) => item.id !== itemId
          );
          state.sessionStats.itemsCompleted++;

          // Update average completion time
          const total =
            state.sessionStats.avgCompletionTime *
            (state.sessionStats.itemsCompleted - 1);
          state.sessionStats.avgCompletionTime =
            (total + completionTime) / state.sessionStats.itemsCompleted;

          if (state.activeItem?.id === itemId) {
            state.activeItem = null;
          }
        }),

      skipItem: (itemId) =>
        set((state) => {
          state.sessionStats.itemsSkipped++;
          if (state.activeItem?.id === itemId) {
            state.activeItem = null;
          }
        }),

      toggleItemSelection: (itemId) =>
        set((state) => {
          const newSet = new Set(state.selectedItems);
          if (newSet.has(itemId)) {
            newSet.delete(itemId);
          } else {
            newSet.add(itemId);
          }
          state.selectedItems = newSet;
        }),

      selectAll: () =>
        set((state) => {
          state.selectedItems = new Set(
            state.currentQueue.map((item) => item.id)
          );
        }),

      clearSelection: () =>
        set((state) => {
          state.selectedItems = new Set();
        }),

      setBatchMode: (enabled) =>
        set((state) => {
          state.batchMode = enabled;
          if (!enabled) {
            state.selectedItems = new Set();
          }
        }),

      resetSessionStats: () =>
        set((state) => {
          state.sessionStats = {
            itemsCompleted: 0,
            itemsSkipped: 0,
            startTime: new Date(),
            avgCompletionTime: 0,
          };
        }),
    })),
    {
      name: "work-queue-store",
    }
  )
);
