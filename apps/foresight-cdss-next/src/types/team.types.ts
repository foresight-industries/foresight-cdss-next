export type TeamRole = 'owner' | 'admin' | 'coordinator' | 'reviewer' | 'member';
export type MemberStatus = 'active' | 'pending' | 'suspended';
export type PlanType = 'basic' | 'pro' | 'enterprise';

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  settings: Record<string, any>;
  plan_type: PlanType;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: MemberStatus;
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data from user_profiles
  user_profile?: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface CreateTeamRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface InviteTeamMemberRequest {
  email: string;
  role: TeamRole;
  first_name?: string;
  last_name?: string;
}

export interface UpdateTeamMemberRequest {
  role?: TeamRole;
  status?: MemberStatus;
}