"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, UserProfileUpdate } from "@/types/profile.types";
import { Tables } from "@/lib/supabase";

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(Tables.USER_PROFILE)
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  // Ensure timezone has a default value if null
  return {
    ...data,
    timezone: data.timezone ?? "America/New_York",
  };
}

async function updateUserProfileFn(params: { userId: string; updates: UserProfileUpdate }): Promise<UserProfile> {
  const { userId, updates } = params;
  const supabase = createClient();

  const { data, error } = await supabase
    .from(Tables.USER_PROFILE)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;

  // Ensure timezone has a default value if null
  return {
    ...data,
    timezone: data.timezone || "America/New_York",
  };
}

export function useUserProfile() {
  const { user } = useAuth();
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
