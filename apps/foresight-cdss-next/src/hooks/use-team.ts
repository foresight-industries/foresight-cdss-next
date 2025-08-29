'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { Team, TeamMember, TeamInvitation, InviteTeamMemberRequest, UpdateTeamMemberRequest } from '@/types/team.types';

export function useTeam() {
  const { user } = useAuth();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        // Get user's current team
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('current_team_id')
          .eq('id', user.id)
          .single();

        if (!profile?.current_team_id) {
          setLoading(false);
          return;
        }

        // Get team details
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', profile.current_team_id)
          .single();

        if (teamError) throw teamError;
        setCurrentTeam(team);

        // Get team members with user profiles
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select(`
            *,
            user_profile:user_profiles(email, first_name, last_name)
          `)
          .eq('team_id', profile.current_team_id)
          .eq('status', 'active');

        if (membersError) throw membersError;
        setTeamMembers(members || []);

        // Get pending invitations
        const { data: invitations, error: invitationsError } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('team_id', profile.current_team_id)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString());

        if (invitationsError) throw invitationsError;
        setPendingInvitations(invitations || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamData();
  }, [user]);

  const inviteTeamMember = async (invite: InviteTeamMemberRequest): Promise<boolean> => {
    if (!currentTeam) return false;

    try {
      const supabase = createClient();
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', invite.email)
        .single();

      if (existingUser) {
        // User exists, add them directly
        const { error } = await supabase
          .from('team_members')
          .insert({
            team_id: currentTeam.id,
            user_id: existingUser.id,
            role: invite.role,
            status: 'active',
            invited_by: user?.id,
            joined_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Create invitation
        const { error } = await supabase
          .from('team_invitations')
          .insert({
            team_id: currentTeam.id,
            email: invite.email,
            role: invite.role,
            invited_by: user?.id
          });

        if (error) throw error;
      }

      // Refresh data
      window.location.reload(); // In production, use more sophisticated state management
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const updateTeamMember = async (memberId: string, updates: UpdateTeamMemberRequest): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('team_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setTeamMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, ...updates }
            : member
        )
      );

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const removeTeamMember = async (memberId: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      // Update local state
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    currentTeam,
    teamMembers,
    pendingInvitations,
    loading,
    error,
    inviteTeamMember,
    updateTeamMember,
    removeTeamMember,
    cancelInvitation,
    isOwner: teamMembers.find(m => m.user_id === user?.id)?.role === 'owner',
    isAdmin: ['owner', 'admin'].includes(teamMembers.find(m => m.user_id === user?.id)?.role || ''),
    currentUserRole: teamMembers.find(m => m.user_id === user?.id)?.role
  };
}