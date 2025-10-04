// stores/sessionStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import CryptoJS from "crypto-js";

// Encryption key from environment variable
const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default-dev-key";

// Custom secure storage
const secureStorage = {
  getItem: (name: string) => {
    const encrypted = sessionStorage.getItem(name); // Use sessionStorage, not localStorage
    if (!encrypted) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  },

  setItem: (name: string, value: string) => {
    const encrypted = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
    sessionStorage.setItem(name, encrypted);
  },

  removeItem: (name: string) => {
    sessionStorage.removeItem(name);
  },
};

interface SessionState {
  // Only non-PHI data
  currentTeamId: string | null;
  teamMemberId: string | null;
  userRole: string | null;
  permissions: string[];

  // Preferences (safe to persist)
  preferences: {
    defaultView: string;
    claimsPerPage: number;
    colorScheme: "light" | "dark" | "system";
  };

  // PHI data - NEVER persisted, only in memory
  _sensitiveData: {
    patientData: any | null;
    claimDetails: any | null;
  };

  // Actions
  setSession: (data: any) => void;
  setSensitiveData: (data: any) => void;
  clearSession: () => void;
}

// Main store WITHOUT DevTools
export const useSessionStore = create<SessionState>()(
  persist(
    immer((set) => ({
      currentTeamId: null,
      teamMemberId: null,
      userRole: null,
      permissions: [],

      preferences: {
        defaultView: "dashboard",
        claimsPerPage: 25,
        colorScheme: "system",
      },

      _sensitiveData: {
        patientData: null,
        claimDetails: null,
      },

      setSession: (data) =>
        set((state) => {
          // Only store IDs and roles, not full objects
          state.currentTeamId = data.team?.id || null;
          state.teamMemberId = data.member?.id || null;
          state.userRole = data.member?.role || null;
          state.permissions = data.permissions || [];
        }),

      setSensitiveData: (data) =>
        set((state) => {
          // This is NEVER persisted
          state._sensitiveData = data;
        }),

      clearSession: () =>
        set((state) => {
          state.currentTeamId = null;
          state.teamMemberId = null;
          state.userRole = null;
          state.permissions = [];
          state._sensitiveData = {
            patientData: null,
            claimDetails: null,
          };
        }),
    })),
    {
      name: "rcm-session",
      storage: secureStorage,
      partialize: (state) => ({
        // Only persist non-sensitive data
        currentTeamId: state.currentTeamId,
        teamMemberId: state.teamMemberId,
        userRole: state.userRole,
        permissions: state.permissions,
        preferences: state.preferences,
        // NEVER include _sensitiveData
      }),
    }
  )
);
