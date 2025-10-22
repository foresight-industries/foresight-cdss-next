"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import type {
  InviteTeamMemberRequest,
  MemberStatus,
  Team,
  TeamInvitation,
  TeamMember,
  TeamRole,
  UpdateTeamMemberRequest,
} from "@/types/team.types";

async function fetchTeamData(userId: string) {
  // Fetch organization data from API endpoint
  const response = await fetch('/api/teams/current');
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired");
    }
    throw new Error('Failed to fetch team data');
  }

  const data = await response.json();

  if (!data.team) {
    return { team: null, members: [], invitations: [] };
  }

  // Transform data to match expected format
  const teamWithDefaults: Team = {
    id: data.team.id,
    name: data.team.name,
    slug: data.team.slug,
    description: data.team.description || null,
    logo_url: data.team.logo_url || null,
    settings: data.team.settings || {},
    plan_type: data.team.plan_type || "basic",
    created_at: data.team.created_at || new Date().toISOString(),
    updated_at: data.team.updated_at || new Date().toISOString(),
  };

  // Transform members with proper defaults
  const membersWithDefaults = (data.members || []).map((member: any) => ({
    id: member.id,
    team_id: member.team_id || "",
    user_id: member.user_id || "",
    role: member.role as TeamRole,
    status: member.status as MemberStatus,
    invited_by: member.invited_by,
    invited_at: member.invited_at || new Date().toISOString(),
    joined_at: member.joined_at,
    created_at: member.created_at || new Date().toISOString(),
    updated_at: member.updated_at || new Date().toISOString(),
    user_profile: member.user_profile || undefined,
  })) as TeamMember[];

  // Transform invitations with proper defaults
  const invitationsWithDefaults: TeamInvitation[] = (data.invitations || []).map(
    (invitation: any) => ({
      id: invitation.id,
      team_id: invitation.team_id || "",
      email: invitation.email,
      role: invitation.role as TeamRole,
      invited_by: invitation.invited_by || "",
      token: invitation.token,
      expires_at: invitation.expires_at || new Date().toISOString(),
      accepted_at: invitation.accepted_at,
      created_at: invitation.created_at || new Date().toISOString(),
    })
  );

  return {
    team: teamWithDefaults,
    members: membersWithDefaults,
    invitations: invitationsWithDefaults,
  };
}

async function inviteTeamMemberFn(params: { currentTeam: Team; invite: InviteTeamMemberRequest; userId: string }) {
  const { invite } = params;

  const response = await fetch('/api/teams/invitations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invite),
  });

  if (!response.ok) {
    throw new Error('Failed to invite team member');
  }
}

async function updateTeamMemberFn(params: { memberId: string; updates: UpdateTeamMemberRequest }) {
  const { memberId, updates } = params;

  const response = await fetch(`/api/teams/members/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update team member');
  }
}

async function removeTeamMemberFn(memberId: string) {
  const response = await fetch(`/api/teams/members/${memberId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to remove team member');
  }
}

async function cancelInvitationFn(invitationId: string) {
  const response = await fetch(`/api/teams/invitations/${invitationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to cancel invitation');
  }
}

export function useTeam() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const {
    data: teamData,
    isLoading: loading,
    error: queryError
  } = useQuery({
    queryKey: ['team', user?.id],
    queryFn: () => fetchTeamData(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  const currentTeam = teamData?.team || null;
  const teamMembers = teamData?.members || [];
  const pendingInvitations = teamData?.invitations || [];
  const error = queryError?.message || null;

  const inviteTeamMemberMutation = useMutation({
    mutationFn: (invite: InviteTeamMemberRequest) =>
      inviteTeamMemberFn({
        currentTeam: currentTeam!,
        invite,
        userId: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", user?.id] });
    },
  });

  const updateTeamMemberMutation = useMutation({
    mutationFn: (params: { memberId: string; updates: UpdateTeamMemberRequest }) =>
      updateTeamMemberFn(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', user?.id] });
    }
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: removeTeamMemberFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', user?.id] });
    }
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: cancelInvitationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', user?.id] });
    }
  });

  return {
    currentTeam,
    teamMembers,
    pendingInvitations,
    loading,
    error,
    inviteTeamMember: async (invite: InviteTeamMemberRequest) => {
      if (!currentTeam) return false;
      try {
        await inviteTeamMemberMutation.mutateAsync(invite);
        return true;
      } catch {
        return false;
      }
    },
    updateTeamMember: async (
      memberId: string,
      updates: UpdateTeamMemberRequest
    ) => {
      try {
        await updateTeamMemberMutation.mutateAsync({ memberId, updates });
        return true;
      } catch {
        return false;
      }
    },
    removeTeamMember: async (memberId: string) => {
      try {
        await removeTeamMemberMutation.mutateAsync(memberId);
        return true;
      } catch {
        return false;
      }
    },
    cancelInvitation: async (invitationId: string) => {
      try {
        await cancelInvitationMutation.mutateAsync(invitationId);
        return true;
      } catch {
        return false;
      }
    },
    isOwner:
      teamMembers.find((m) => m.user_id === user?.id)?.role === "super_admin",
    isAdmin: ["admin"].includes(
      teamMembers.find((m) => m.user_id === user?.id)?.role || ""
    ),
    currentUserRole: teamMembers.find((m) => m.user_id === user?.id)?.role,
  };
}
