// stores/realtimeStore.ts
import { create } from "zustand";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeState {
  // Active subscriptions
  channels: Map<string, RealtimeChannel>;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  lastHeartbeat: Date | null;

  // Presence
  activeUsers: Map<
    string,
    {
      userId: string;
      userName: string;
      currentView: string;
      lastSeen: Date;
    }
  >;

  // Actions
  addChannel: (key: string, channel: RealtimeChannel) => void;
  removeChannel: (key: string) => void;
  clearChannels: () => void;

  setConnectionStatus: (status: RealtimeState["connectionStatus"]) => void;
  updateHeartbeat: () => void;

  updateActiveUser: (
    userId: string,
    data: Partial<
      RealtimeState["activeUsers"] extends Map<string, infer V> ? V : never
    >
  ) => void;
  removeActiveUser: (userId: string) => void;
}

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
  channels: new Map(),
  connectionStatus: "disconnected",
  lastHeartbeat: null,
  activeUsers: new Map(),

  addChannel: (key, channel) =>
    set((state) => {
      const newChannels = new Map(state.channels);
      newChannels.set(key, channel);
      return { channels: newChannels };
    }),

  removeChannel: (key) =>
    set((state) => {
      const newChannels = new Map(state.channels);
      const channel = newChannels.get(key);
      if (channel) {
        channel.unsubscribe();
        newChannels.delete(key);
      }
      return { channels: newChannels };
    }),

  clearChannels: () => {
    const { channels } = get();
    channels.forEach((channel) => channel.unsubscribe());
    set({ channels: new Map() });
  },

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  updateHeartbeat: () => set({ lastHeartbeat: new Date() }),

  updateActiveUser: (userId, data) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers);
      const existing = newUsers.get(userId) || {
        userId,
        userName: "",
        currentView: "",
        lastSeen: new Date(),
      };
      newUsers.set(userId, { ...existing, ...data });
      return { activeUsers: newUsers };
    }),

  removeActiveUser: (userId) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers);
      newUsers.delete(userId);
      return { activeUsers: newUsers };
    }),
}));
