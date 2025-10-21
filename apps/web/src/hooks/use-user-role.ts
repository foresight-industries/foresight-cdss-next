import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

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

    try {
      // Fetch user role from organization membership API
      const response = await fetch('/api/teams/current');
      if (!response.ok) {
        throw new Error('Failed to fetch user role');
      }

      const data = await response.json();
      
      // Find current user's role in the organization members
      const currentUserMember = data.members?.find(
        (member: any) => member.user_id === user.id
      );

      if (currentUserMember) {
        // Map organization roles to UserRole type
        const orgRole = currentUserMember.role;
        let mappedRole: UserRole;
        
        switch (orgRole) {
          case 'owner':
          case 'admin':
            mappedRole = 'admin';
            break;
          case 'coordinator':
          case 'nurse':
          case 'front_desk':
            mappedRole = 'coordinator';
            break;
          case 'viewer':
            mappedRole = 'viewer';
            break;
          default:
            mappedRole = 'user';
        }
        
        setRole(mappedRole);
      } else {
        // User not found in organization, default to user role
        setRole('user');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // Default to user role on error
      setRole('user');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { role, loading };
}
