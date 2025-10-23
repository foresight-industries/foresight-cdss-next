"use client";

import { type ReactNode, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSessionStore } from "@/stores/sessionStore";
import { useRealtimeStore } from "@/stores/realtimeStore";

export function StoreProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { user } = useUser();
  const clearSubscriptions = useRealtimeStore((s) => s.clearSubscriptions);

  useEffect(() => {
    // Initialize session from Clerk auth and AWS database
    const initializeSession = async () => {
      if (!user) {
        // Clear session if no user
        useSessionStore.getState().clearSession?.();
        return;
      }

      try {
        // Fetch organization/team data from API
        const response = await fetch('/api/teams/current');
        if (!response.ok) {
          console.error('Failed to fetch team data for session');
          return;
        }

        const data = await response.json();
        
        if (data.team && data.members) {
          // Find current user's membership
          const currentMember = data.members.find(
            (member: any) => member.user_id === user.id
          );

          if (currentMember) {
            useSessionStore.getState().setSession({
              team: data.team, // Organization data mapped as team
              member: currentMember,
              permissions: currentMember.permissions || [],
            });
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();

    // Cleanup on unmount
    return () => {
      clearSubscriptions();
    };
  }, [user, clearSubscriptions]); // Added user to dependencies

  return <>{children}</>;
}
