import { StateCreator } from "zustand";
import type { Tables } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

export interface AdminSlice {
  // State
  teams: Tables<"team">[];
  teamMembers: Tables<"team_member">[];
  teamInvitations: Tables<"team_invitation">[];
  teamSettings: Tables<"team_settings">[];
  userProfiles: Tables<"user_profile">[];
  userSessions: Tables<"user_session">[];
  systemSettings: Tables<"system_settings">[];
  apiKeys: Tables<"api_key">[];
  apiVersions: Tables<"api_version">[];
  auditLogs: Tables<"audit_log">[];
  securityAuditLogs: Tables<"security_audit_log">[];
  phiExportLogs: Tables<"phi_export_log">[];

  // Loading states
  teamsLoading: boolean;
  teamMembersLoading: boolean;
  userProfilesLoading: boolean;
  systemSettingsLoading: boolean;
  auditLogsLoading: boolean;

  // Error states
  teamsError: string | null;
  teamMembersError: string | null;
  userProfilesError: string | null;

  // Filter state
  adminFilters: {
    teamId?: string;
    userRole?: string;
    activeOnly?: boolean;
    dateRange?:
      | "today"
      | "last_7_days"
      | "last_30_days"
      | "last_90_days"
      | "custom";
    customDateRange?: { from: Date; to: Date };
  };

  // Actions
  setTeams: (teams: Tables<"team">[]) => void;
  addTeam: (team: Tables<"team">) => void;
  updateTeam: (id: string, updates: Partial<Tables<"team">>) => void;
  removeTeam: (id: string) => void;

  // Team members actions
  setTeamMembers: (members: Tables<"team_member">[]) => void;
  addTeamMember: (member: Tables<"team_member">) => void;
  updateTeamMember: (
    id: string,
    updates: Partial<Tables<"team_member">>
  ) => void;
  removeTeamMember: (id: string) => void;

  // Team invitations actions
  setTeamInvitations: (invitations: Tables<"team_invitation">[]) => void;
  addTeamInvitation: (invitation: Tables<"team_invitation">) => void;
  updateTeamInvitation: (
    id: string,
    updates: Partial<Tables<"team_invitation">>
  ) => void;
  removeTeamInvitation: (id: string) => void;

  // Team settings actions
  setTeamSettings: (settings: Tables<"team_settings">[]) => void;
  updateTeamSettings: (
    teamId: string,
    updates: Partial<Tables<"team_settings">>
  ) => void;

  // User profiles actions
  setUserProfiles: (profiles: Tables<"user_profile">[]) => void;
  addUserProfile: (profile: Tables<"user_profile">) => void;
  updateUserProfile: (
    id: string,
    updates: Partial<Tables<"user_profile">>
  ) => void;
  removeUserProfile: (id: string) => void;

  // User sessions actions
  setUserSessions: (sessions: Tables<"user_session">[]) => void;
  addUserSession: (session: Tables<"user_session">) => void;
  updateUserSession: (
    id: string,
    updates: Partial<Tables<"user_session">>
  ) => void;

  // System settings actions
  setSystemSettings: (settings: Tables<"system_settings">[]) => void;
  updateSystemSettings: (key: string, value: any) => void;

  // API keys actions
  setApiKeys: (keys: Tables<"api_key">[]) => void;
  addApiKey: (key: Tables<"api_key">) => void;
  updateApiKey: (id: string, updates: Partial<Tables<"api_key">>) => void;
  removeApiKey: (id: string) => void;

  // API versions actions
  setApiVersions: (versions: Tables<"api_version">[]) => void;
  addApiVersion: (version: Tables<"api_version">) => void;

  // Audit logs actions
  setAuditLogs: (logs: Tables<"audit_log">[]) => void;
  addAuditLog: (log: Tables<"audit_log">) => void;

  // Security audit logs actions
  setSecurityAuditLogs: (logs: Tables<"security_audit_log">[]) => void;
  addSecurityAuditLog: (log: Tables<"security_audit_log">) => void;

  // PHI export logs actions
  setPHIExportLogs: (logs: Tables<"phi_export_log">[]) => void;
  addPHIExportLog: (log: Tables<"phi_export_log">) => void;

  // Filter actions
  setAdminFilters: (filters: AdminSlice["adminFilters"]) => void;
  clearAdminFilters: () => void;

  // Async actions
  fetchTeams: () => Promise<void>;
  fetchTeamMembers: (teamId?: string) => Promise<void>;
  fetchTeamInvitations: (teamId?: string) => Promise<void>;
  fetchTeamSettings: (teamId: string) => Promise<void>;
  fetchUserProfiles: () => Promise<void>;
  fetchUserSessions: () => Promise<void>;
  fetchSystemSettings: () => Promise<void>;
  fetchApiKeys: () => Promise<void>;
  fetchApiVersions: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  fetchSecurityAuditLogs: () => Promise<void>;
  fetchPHIExportLogs: () => Promise<void>;
  inviteTeamMember: (
    teamId: string,
    email: string,
    role: string
  ) => Promise<void>;
  acceptTeamInvitation: (invitationId: string) => Promise<void>;
  revokeApiKey: (keyId: string) => Promise<void>;
}

export const createAdminSlice: StateCreator<AdminSlice, [], [], AdminSlice> = (
  set,
  get
) => ({
  // Initial state
  teams: [],
  teamMembers: [],
  teamInvitations: [],
  teamSettings: [],
  userProfiles: [],
  userSessions: [],
  systemSettings: [],
  apiKeys: [],
  apiVersions: [],
  auditLogs: [],
  securityAuditLogs: [],
  phiExportLogs: [],

  // Loading states
  teamsLoading: false,
  teamMembersLoading: false,
  userProfilesLoading: false,
  systemSettingsLoading: false,
  auditLogsLoading: false,

  // Error states
  teamsError: null,
  teamMembersError: null,
  userProfilesError: null,

  // Filter state
  adminFilters: {
    activeOnly: true,
    dateRange: "last_30_days",
  },

  // Teams actions
  setTeams: (teams) => set({ teams }),

  addTeam: (team) =>
    set((state) => ({
      teams: [...state.teams, team],
    })),

  updateTeam: (id, updates) =>
    set((state) => ({
      teams: state.teams.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  removeTeam: (id) =>
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== id),
    })),

  // Team members actions
  setTeamMembers: (members) => set({ teamMembers: members }),

  addTeamMember: (member) =>
    set((state) => ({
      teamMembers: [...state.teamMembers, member],
    })),

  updateTeamMember: (id, updates) =>
    set((state) => ({
      teamMembers: state.teamMembers.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  removeTeamMember: (id) =>
    set((state) => ({
      teamMembers: state.teamMembers.filter((m) => m.id !== id),
    })),

  // Team invitations actions
  setTeamInvitations: (invitations) => set({ teamInvitations: invitations }),

  addTeamInvitation: (invitation) =>
    set((state) => ({
      teamInvitations: [...state.teamInvitations, invitation],
    })),

  updateTeamInvitation: (id, updates) =>
    set((state) => ({
      teamInvitations: state.teamInvitations.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  removeTeamInvitation: (id) =>
    set((state) => ({
      teamInvitations: state.teamInvitations.filter((i) => i.id !== id),
    })),

  // Team settings actions
  setTeamSettings: (settings) => set({ teamSettings: settings }),

  updateTeamSettings: (teamId, updates) =>
    set((state) => ({
      teamSettings: state.teamSettings.map((s) =>
        s.team_id === teamId ? { ...s, ...updates } : s
      ),
    })),

  // User profiles actions
  setUserProfiles: (profiles) => set({ userProfiles: profiles }),

  addUserProfile: (profile) =>
    set((state) => ({
      userProfiles: [...state.userProfiles, profile],
    })),

  updateUserProfile: (id, updates) =>
    set((state) => ({
      userProfiles: state.userProfiles.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  removeUserProfile: (id) =>
    set((state) => ({
      userProfiles: state.userProfiles.filter((p) => p.id !== id),
    })),

  // User sessions actions
  setUserSessions: (sessions) => set({ userSessions: sessions }),

  addUserSession: (session) =>
    set((state) => ({
      userSessions: [...state.userSessions, session],
    })),

  updateUserSession: (id, updates) =>
    set((state) => ({
      userSessions: state.userSessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  // System settings actions
  setSystemSettings: (settings) => set({ systemSettings: settings }),

  updateSystemSettings: (key, value) =>
    set((state) => ({
      systemSettings: state.systemSettings.map((s) =>
        s.key === key ? { ...s, value } : s
      ),
    })),

  // API keys actions
  setApiKeys: (keys) => set({ apiKeys: keys }),

  addApiKey: (key) =>
    set((state) => ({
      apiKeys: [...state.apiKeys, key],
    })),

  updateApiKey: (id, updates) =>
    set((state) => ({
      apiKeys: state.apiKeys.map((k) =>
        k.id === id ? { ...k, ...updates } : k
      ),
    })),

  removeApiKey: (id) =>
    set((state) => ({
      apiKeys: state.apiKeys.filter((k) => k.id !== id),
    })),

  // API versions actions
  setApiVersions: (versions) => set({ apiVersions: versions }),

  addApiVersion: (version) =>
    set((state) => ({
      apiVersions: [...state.apiVersions, version],
    })),

  // Audit logs actions
  setAuditLogs: (logs) => set({ auditLogs: logs }),

  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [log, ...state.auditLogs],
    })),

  // Security audit logs actions
  setSecurityAuditLogs: (logs) => set({ securityAuditLogs: logs }),

  addSecurityAuditLog: (log) =>
    set((state) => ({
      securityAuditLogs: [log, ...state.securityAuditLogs],
    })),

  // PHI export logs actions
  setPHIExportLogs: (logs) => set({ phiExportLogs: logs }),

  addPHIExportLog: (log) =>
    set((state) => ({
      phiExportLogs: [log, ...state.phiExportLogs],
    })),

  // Filter actions
  setAdminFilters: (filters) =>
    set((state) => ({
      adminFilters: { ...state.adminFilters, ...filters },
    })),

  clearAdminFilters: () =>
    set({
      adminFilters: {
        activeOnly: true,
        dateRange: "last_30_days",
      },
    }),

  // Async actions
  fetchTeams: async () => {
    set({ teamsLoading: true, teamsError: null });
    try {
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ teams: data || [], teamsLoading: false });
    } catch (error) {
      set({
        teamsError:
          error instanceof Error ? error.message : "Failed to fetch teams",
        teamsLoading: false,
      });
    }
  },

  fetchTeamMembers: async (teamId) => {
    set({ teamMembersLoading: true, teamMembersError: null });
    try {
      let query = supabase.from("team_member").select("*");

      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      set({ teamMembers: data || [], teamMembersLoading: false });
    } catch (error) {
      set({
        teamMembersError:
          error instanceof Error
            ? error.message
            : "Failed to fetch team members",
        teamMembersLoading: false,
      });
    }
  },

  fetchTeamInvitations: async (teamId) => {
    try {
      let query = supabase.from("team_invitation").select("*");

      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      set({ teamInvitations: data || [] });
    } catch (error) {
      console.error("Failed to fetch team invitations:", error);
    }
  },

  fetchTeamSettings: async (teamId) => {
    try {
      const { data, error } = await supabase
        .from("team_settings")
        .select("*")
        .eq("team_id", teamId);

      if (error) throw error;
      set({ teamSettings: data || [] });
    } catch (error) {
      console.error("Failed to fetch team settings:", error);
    }
  },

  fetchUserProfiles: async () => {
    set({ userProfilesLoading: true, userProfilesError: null });
    try {
      const { data, error } = await supabase
        .from("user_profile")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ userProfiles: data || [], userProfilesLoading: false });
    } catch (error) {
      set({
        userProfilesError:
          error instanceof Error
            ? error.message
            : "Failed to fetch user profiles",
        userProfilesLoading: false,
      });
    }
  },

  fetchUserSessions: async () => {
    try {
      const { data, error } = await supabase
        .from("user_session")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ userSessions: data || [] });
    } catch (error) {
      console.error("Failed to fetch user sessions:", error);
    }
  },

  fetchSystemSettings: async () => {
    set({ systemSettingsLoading: true });
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*");

      if (error) throw error;
      set({ systemSettings: data || [], systemSettingsLoading: false });
    } catch (error) {
      set({ systemSettingsLoading: false });
    }
  },

  fetchApiKeys: async () => {
    try {
      const { data, error } = await supabase
        .from("api_key")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ apiKeys: data || [] });
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    }
  },

  fetchApiVersions: async () => {
    try {
      const { data, error } = await supabase
        .from("api_version")
        .select("*")
        .order("version", { ascending: false });

      if (error) throw error;
      set({ apiVersions: data || [] });
    } catch (error) {
      console.error("Failed to fetch API versions:", error);
    }
  },

  fetchAuditLogs: async () => {
    set({ auditLogsLoading: true });
    try {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      set({ auditLogs: data || [], auditLogsLoading: false });
    } catch (error) {
      set({ auditLogsLoading: false });
    }
  },

  fetchSecurityAuditLogs: async () => {
    try {
      const { data, error } = await supabase
        .from("security_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      set({ securityAuditLogs: data || [] });
    } catch (error) {
      console.error("Failed to fetch security audit logs:", error);
    }
  },

  fetchPHIExportLogs: async () => {
    try {
      const { data, error } = await supabase
        .from("phi_export_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      set({ phiExportLogs: data || [] });
    } catch (error) {
      console.error("Failed to fetch PHI export logs:", error);
    }
  },

  inviteTeamMember: async (teamId, email, role) => {
    try {
      const { data, error } = await supabase
        .from("team_invitation")
        .insert([
          {
            team_id: teamId,
            email,
            role,
            status: "pending",
            invited_at: new Date().toISOString(),
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(), // 7 days
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        get().addTeamInvitation(data);
      }
    } catch (error) {
      console.error("Failed to invite team member:", error);
      throw error;
    }
  },

  acceptTeamInvitation: async (invitationId) => {
    try {
      const { error } = await supabase
        .from("team_invitation")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (error) throw error;

      // Update local state
      get().updateTeamInvitation(invitationId, {
        status: "accepted",
        accepted_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to accept team invitation:", error);
      throw error;
    }
  },

  revokeApiKey: async (keyId) => {
    try {
      const { error } = await supabase
        .from("api_key")
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq("id", keyId);

      if (error) throw error;

      // Update local state
      get().updateApiKey(keyId, {
        is_active: false,
        revoked_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      throw error;
    }
  },
});
