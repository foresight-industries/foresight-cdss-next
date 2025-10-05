import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { Tables } from "@/lib/supabase";

export type UserRole = 'admin' | 'coordinator' | 'user' | 'viewer';

export function useUserRole() {
  const { user } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from(Tables.USER_PROFILE)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setRole(data.role as UserRole);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { role, loading };
}
