"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import type {
  InviteTeamMemberRequest,
  MemberStatus,
  PlanType,
  Team,
  TeamInvitation,
  TeamMember,
  TeamRole,
  UpdateTeamMemberRequest,
} from "@/types/team.types";
import { Tables } from "@/lib/supabase";

async function fetchTeamData(userId: string) {
  const supabase = createClient();

  // Get a user's current team
  const { data: profile, error: profileError } = await supabase
    .from(Tables.USER_PROFILE)
    .select("current_team_id")
    .eq("id", userId)
    .single();

  // Handle auth errors by signing out
  if (
    profileError?.code === "PGRST301" ||
    profileError?.message?.includes("JWT")
  ) {
    await supabase.auth.signOut();
    throw new Error("Session expired");
  }

  if (profileError) throw profileError;

  if (!profile?.current_team_id) {
    return { team: null, members: [], invitations: [] };
  }

  // Get team details
  const { data: team, error: teamError } = await supabase
    .from(Tables.TEAM)
    .select("*")
    .eq("id", profile.current_team_id)
    .single();

  if (teamError) throw teamError;

  // Get team members with user profiles
  const { data: members, error: membersError } = await supabase
    .from(Tables.TEAM_MEMBER)
    .select(
      `
      *,
      user_profile(email, first_name, last_name)
    `
    )
    .eq("team_id", profile.current_team_id)
    .eq("status", "active");

  if (membersError) throw membersError;

  // Get pending invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from(Tables.TEAM_INVITATION)
    .select("*")
    .eq("team_id", profile.current_team_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString());

  if (invitationsError) throw invitationsError;

  // Transform team with proper defaults
  const teamWithDefaults: Team = {
    id: team.id,
    name: team.name,
    slug: team.slug,
    description: team.description,
    logo_url: team.logo_url,
    settings: (team.settings as Record<string, string>) || {},
    plan_type: (team.plan_type as PlanType) || "basic",
    created_at: team.created_at || new Date().toISOString(),
    updated_at: team.updated_at || new Date().toISOString(),
  };

  // Transform members with proper defaults
  const membersWithDefaults = (members || []).map((member) => ({
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
  })) as unknown as TeamMember[];

  // Transform invitations with proper defaults
  const invitationsWithDefaults: TeamInvitation[] = (invitations || []).map(
    (invitation) => ({
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
  const { currentTeam, invite, userId } = params;
  const supabase = createClient();

  // Check if a user already exists
  const { data: existingUser } = await supabase
    .from(Tables.USER_PROFILE)
    .select('id')
    .eq('email', invite.email)
    .single();

  if (existingUser) {
    // User exists, add them directly
    const { error } = await supabase
      .from(Tables.TEAM_MEMBER)
      .insert({
        team_id: currentTeam.id,
        user_id: existingUser.id,
        role: invite.role,
        status: 'active',
        invited_by: userId,
        joined_at: new Date().toISOString()
      });

    if (error) throw error;
  } else {
    // Create invitation
    const { error } = await supabase
      .from(Tables.TEAM_INVITATION)
      .insert({
        team_id: currentTeam.id,
        email: invite.email,
        role: invite.role,
        invited_by: userId
      });

    if (error) throw error;
  }
}

async function updateTeamMemberFn(params: { memberId: string; updates: UpdateTeamMemberRequest }) {
  const { memberId, updates } = params;
  const supabase = createClient();

  const { error } = await supabase
    .from(Tables.TEAM_MEMBER)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) throw error;
}

async function removeTeamMemberFn(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from(Tables.TEAM_MEMBER)
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

async function cancelInvitationFn(invitationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from(Tables.TEAM_INVITATION)
    .delete()
    .eq('id', invitationId);

  if (error) throw error;
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
