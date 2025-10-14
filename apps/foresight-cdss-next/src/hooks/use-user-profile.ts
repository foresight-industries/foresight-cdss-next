"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import type { UserProfile, UserProfileUpdate } from "@/types/profile.types";

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  // AWS schema doesn't have user_profile table - user data comes from Clerk
  // Fetch user preferences/settings from API endpoint or use defaults
  try {
    const response = await fetch('/api/profile');
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const data = await response.json();
    
    // Ensure defaults are set
    return {
      id: userId,
      email: data.email || null,
      first_name: data.firstName || data.first_name || null,
      last_name: data.lastName || data.last_name || null,
      role: data.role || "user",
      department: data.department || null,
      job_title: data.job_title || null,
      phone: data.phone || null,
      location: data.location || null,
      timezone: data.timezone || "America/New_York",
      bio: data.bio || null,
      avatar_url: data.avatar_url || null,
      created_at: data.createdAt || data.created_at || new Date().toISOString(),
      updated_at: data.updatedAt || data.updated_at || new Date().toISOString(),
    };
  } catch {
    // Fallback to minimal profile with defaults
    return {
      id: userId,
      email: null,
      first_name: null,
      last_name: null,
      role: "user",
      department: null,
      job_title: null,
      phone: null,
      location: null,
      timezone: "America/New_York",
      bio: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

async function updateUserProfileFn(params: { userId: string; updates: UserProfileUpdate }): Promise<UserProfile> {
  const { userId, updates } = params;
  
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }

  const data = await response.json();
  
  // Ensure defaults are set
  return {
    id: userId,
    email: data.email || null,
    first_name: data.firstName || data.first_name || null,
    last_name: data.lastName || data.last_name || null,
    role: data.role || "user",
    department: data.department || null,
    job_title: data.job_title || null,
    phone: data.phone || null,
    location: data.location || null,
    timezone: data.timezone || "America/New_York",
    bio: data.bio || null,
    avatar_url: data.avatar_url || null,
    created_at: data.createdAt || data.created_at || new Date().toISOString(),
    updated_at: data.updatedAt || data.updated_at || new Date().toISOString(),
  };
}

export function useUserProfile() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading: loading,
    error: queryError
  } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    retry: 2
  });

  const error = queryError?.message || null;

  const updateProfileMutation = useMutation({
    mutationFn: (updates: UserProfileUpdate) =>
      updateUserProfileFn({ userId: user!.id, updates }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['userProfile', user?.id], updatedProfile);
    }
  });

  return {
    profile: profile || null,
    loading,
    error,
    updateProfile: async (updates: UserProfileUpdate): Promise<boolean> => {
      if (!user) return false;
      try {
        await updateProfileMutation.mutateAsync(updates);
        return true;
      } catch {
        return false;
      }
    },
    hasRole: (role: string) => profile?.role === role,
    isAdmin: profile?.role === "super_admin" || profile?.role === "org_admin",
    isCoordinator: profile?.role === "nurse" || profile?.role === "front_desk",
  };
}
