// providers/StoreProvider.tsx
"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useRealtimeStore } from "@/stores/realtimeStore";
import { createClient } from "@/lib/supabase/client";

export function StoreProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const clearChannels = useRealtimeStore((s) => s.clearChannels);

  useEffect(() => {
    // Initialize session from Supabase auth
    const initializeSession = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Fetch user profile and team data
        const { data: profile } = await supabase
          .from("user_profile")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile?.current_team_id) {
          const { data: team } = await supabase
            .from("team")
            .select("*")
            .eq("id", profile.current_team_id)
            .single();

          const { data: member } = await supabase
            .from("team_member")
            .select("*")
            .eq("user_id", user.id)
            .eq("team_id", profile.current_team_id)
            .single();

          if (team && member) {
            useSessionStore.getState().setSession({
              team,
              member,
              permissions: (member.permissions as string[]) || [],
            });
          }
        }
      }
    };

    initializeSession();

    // Cleanup on unmount
    return () => {
      clearChannels();
    };
  }, [clearChannels]);

  return <>{children}</>;
}
