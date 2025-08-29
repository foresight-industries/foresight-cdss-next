'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile, UserProfileUpdate } from '@/types/profile.types';
import { Tables } from "@/lib/supabase";

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from(Tables.USER_PROFILE)
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          // Ensure timezone has a default value if null
          const profileWithDefaults = {
            ...data,
            timezone: data.timezone || 'America/New_York'
          };
          setProfile(profileWithDefaults);
        }
      } catch (err) {
        setError('Failed to fetch profile');
        console.error('Error fetching profile:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: UserProfileUpdate): Promise<boolean> => {
    if (!user || !profile) return false;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(Tables.USER_PROFILE)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return false;
      }

      // Ensure timezone has a default value if null
      const profileWithDefaults = {
        ...data,
        timezone: data.timezone || 'America/New_York'
      };
      setProfile(profileWithDefaults);
      return true;
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    hasRole: (role: string) => profile?.role === role,
    isAdmin: profile?.role === 'admin',
    isCoordinator: profile?.role === 'coordinator'
  };
}
