// stores/uiStore.ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Notification } from "./types";

interface UIState {
  // Layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;

  // Modals
  activeModal: {
    type:
      | "claim-detail"
      | "pa-detail"
      | "patient-detail"
      | "denial-appeal"
      | null;
    data?: any;
  } | null;

  // Notifications
  notifications: Notification[];

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Actions
  toggleSidebar: () => void;
  collapseSidebar: (collapsed: boolean) => void;
  toggleCommandPalette: () => void;

  openModal: (
    type: NonNullable<UIState["activeModal"]>["type"],
    data?: any
  ) => void;
  closeModal: () => void;

  showNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    sidebarOpen: true,
    sidebarCollapsed: false,
    commandPaletteOpen: false,
    activeModal: null,
    notifications: [],
    globalLoading: false,
    loadingMessage: null,

    // Layout actions
    toggleSidebar: () =>
      set((state) => ({
        sidebarOpen: !state.sidebarOpen,
      })),

    collapseSidebar: (collapsed) =>
      set({
        sidebarCollapsed: collapsed,
      }),

    toggleCommandPalette: () =>
      set((state) => ({
        commandPaletteOpen: !state.commandPaletteOpen,
      })),

    // Modal actions
    openModal: (type, data) =>
      set({
        activeModal: { type, data },
      }),

    closeModal: () =>
      set({
        activeModal: null,
      }),

    // Notification actions
    showNotification: (notification) => {
      const id = crypto.randomUUID();
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now(),
        duration: notification.duration ?? 5000,
      };

      set((state) => ({
        notifications: [...state.notifications, newNotification],
      }));

      // Auto-remove after duration
      if ((newNotification?.duration ?? 0) > 0) {
        setTimeout(() => {
          get().removeNotification(id);
        }, newNotification.duration);
      }
    },

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    clearNotifications: () =>
      set({
        notifications: [],
      }),

    // Loading actions
    setGlobalLoading: (loading, message) =>
      set({
        globalLoading: loading,
        loadingMessage: message || null,
      }),
  }))
);

// Auto-cleanup old notifications
useUIStore.subscribe(
  (state) => state.notifications,
  (notifications) => {
    if (notifications.length > 5) {
      const toRemove = notifications.slice(0, -5);
      for (const n of toRemove) useUIStore.getState().removeNotification(n.id);
    }
  }
);
