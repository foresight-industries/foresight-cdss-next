import { StateCreator } from "zustand";
import { TeamRole } from "@/types/team.types";

// AWS-compatible types
type Organization = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TeamMember = {
  id: string;
  organizationId: string;
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TeamInvitation = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
};

type SystemSettings = {
  id: string;
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
};

type ApiKey = {
  id: string;
  organizationId: string;
  name: string;
  keyHash: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
};

type AuditLog = {
  id: string;
  organizationId: string;
  userId: string;
  action: string;
  resource: string;
  details: any;
  createdAt: Date;
};

export interface AdminSlice {
  // State
  organizations: Organization[];
  teamMembers: TeamMember[];
  teamInvitations: TeamInvitation[];
  systemSettings: SystemSettings[];
  apiKeys: ApiKey[];
  auditLogs: AuditLog[];

  // Loading states
  organizationsLoading: boolean;
  teamMembersLoading: boolean;
  systemSettingsLoading: boolean;
  auditLogsLoading: boolean;

  // Error states
  organizationsError: string | null;
  teamMembersError: string | null;

  // Filter state
  adminFilters: {
    organizationId?: string;
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

  // Organizations actions
  setOrganizations: (organizations: Organization[]) => void;
  addOrganization: (organization: Organization) => void;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  removeOrganization: (id: string) => void;

  // Team members actions
  setTeamMembers: (members: TeamMember[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;

  // Team invitations actions
  setTeamInvitations: (invitations: TeamInvitation[]) => void;
  addTeamInvitation: (invitation: TeamInvitation) => void;
  updateTeamInvitation: (id: string, updates: Partial<TeamInvitation>) => void;
  removeTeamInvitation: (id: string) => void;

  // System settings actions
  setSystemSettings: (settings: SystemSettings[]) => void;
  updateSystemSettings: (key: string, value: any) => void;

  // API keys actions
  setApiKeys: (keys: ApiKey[]) => void;
  addApiKey: (key: ApiKey) => void;
  updateApiKey: (id: string, updates: Partial<ApiKey>) => void;
  removeApiKey: (id: string) => void;

  // Audit logs actions
  setAuditLogs: (logs: AuditLog[]) => void;
  addAuditLog: (log: AuditLog) => void;

  // Filter actions
  setAdminFilters: (filters: AdminSlice["adminFilters"]) => void;
  clearAdminFilters: () => void;

  // Async actions
  fetchOrganizations: () => Promise<void>;
  fetchTeamMembers: (organizationId?: string) => Promise<void>;
  fetchTeamInvitations: (organizationId?: string) => Promise<void>;
  fetchSystemSettings: () => Promise<void>;
  fetchApiKeys: () => Promise<void>;
  fetchAuditLogs: () => Promise<void>;
  inviteTeamMember: (
    organizationId: string,
    email: string,
    role: TeamRole
  ) => Promise<void>;
  acceptTeamInvitation: (invitationId: string) => Promise<void>;
  revokeApiKey: (keyId: string) => Promise<void>;
}

export const createAdminSlice: StateCreator<AdminSlice, [], [], AdminSlice> = (
  set,
  get
) => ({
  // Initial state
  organizations: [],
  teamMembers: [],
  teamInvitations: [],
  systemSettings: [],
  apiKeys: [],
  auditLogs: [],

  // Loading states
  organizationsLoading: false,
  teamMembersLoading: false,
  systemSettingsLoading: false,
  auditLogsLoading: false,

  // Error states
  organizationsError: null,
  teamMembersError: null,

  // Filter state
  adminFilters: {
    activeOnly: true,
    dateRange: "last_30_days",
  },

  // Organizations actions
  setOrganizations: (organizations) => set({ organizations }),

  addOrganization: (organization) =>
    set((state) => ({
      organizations: [...state.organizations, organization],
    })),

  updateOrganization: (id, updates) =>
    set((state) => ({
      organizations: state.organizations.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),

  removeOrganization: (id) =>
    set((state) => ({
      organizations: state.organizations.filter((o) => o.id !== id),
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

  // Audit logs actions
  setAuditLogs: (logs) => set({ auditLogs: logs }),

  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [log, ...state.auditLogs],
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
  fetchOrganizations: async () => {
    set({ organizationsLoading: true, organizationsError: null });
    try {
      const response = await fetch('/api/admin/organizations');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      
      const data = await response.json();
      set({ organizations: data.organizations || [], organizationsLoading: false });
    } catch (error) {
      set({
        organizationsError:
          error instanceof Error ? error.message : "Failed to fetch organizations",
        organizationsLoading: false,
      });
    }
  },

  fetchTeamMembers: async (organizationId) => {
    set({ teamMembersLoading: true, teamMembersError: null });
    try {
      const url = organizationId 
        ? `/api/admin/team-members?organizationId=${organizationId}`
        : '/api/admin/team-members';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch team members');
      
      const data = await response.json();
      set({ teamMembers: data.teamMembers || [], teamMembersLoading: false });
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

  fetchTeamInvitations: async (organizationId) => {
    try {
      const url = organizationId 
        ? `/api/admin/team-invitations?organizationId=${organizationId}`
        : '/api/admin/team-invitations';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch team invitations');
      
      const data = await response.json();
      set({ teamInvitations: data.teamInvitations || [] });
    } catch (error) {
      console.error("Failed to fetch team invitations:", error);
    }
  },

  fetchSystemSettings: async () => {
    set({ systemSettingsLoading: true });
    try {
      const response = await fetch('/api/admin/system-settings');
      if (!response.ok) throw new Error('Failed to fetch system settings');
      
      const data = await response.json();
      set({ systemSettings: data.systemSettings || [], systemSettingsLoading: false });
    } catch (error) {
      set({ systemSettingsLoading: false });
      console.error("Failed to fetch system settings:", error);
    }
  },

  fetchApiKeys: async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) throw new Error('Failed to fetch API keys');
      
      const data = await response.json();
      set({ apiKeys: data.apiKeys || [] });
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    }
  },

  fetchAuditLogs: async () => {
    set({ auditLogsLoading: true });
    try {
      const response = await fetch('/api/admin/audit-logs');
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      set({ auditLogs: data.auditLogs || [], auditLogsLoading: false });
    } catch (error) {
      set({ auditLogsLoading: false });
      console.error("Failed to fetch audit logs:", error);
    }
  },

  inviteTeamMember: async (organizationId, email, role: TeamRole) => {
    try {
      const response = await fetch('/api/admin/team-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          email,
          role,
        }),
      });

      if (!response.ok) throw new Error('Failed to invite team member');
      
      const data = await response.json();
      if (data.invitation) {
        get().addTeamInvitation(data.invitation);
      }
    } catch (error) {
      console.error("Failed to invite team member:", error);
      throw error;
    }
  },

  acceptTeamInvitation: async (invitationId) => {
    try {
      const response = await fetch(`/api/admin/team-invitations/${invitationId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to accept team invitation');

      // Update local state
      get().updateTeamInvitation(invitationId, {
        acceptedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to accept team invitation:", error);
      throw error;
    }
  },

  revokeApiKey: async (keyId) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}/revoke`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to revoke API key');

      // Update local state
      get().updateApiKey(keyId, {
        isActive: false,
      });
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      throw error;
    }
  },
});