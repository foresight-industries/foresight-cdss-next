'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';

interface TeamContext {
  teamSlug: string | null; // Organization slug for backward compatibility
  teamId: string | null; // Organization ID for backward compatibility
  teamName: string | null; // Organization name for backward compatibility
  isTeamContext: boolean; // Whether in organization context
  getTeamUrl: (path?: string) => string; // Get organization-specific URL
  getMainUrl: (path?: string) => string;
}

export function useTeamContext(): TeamContext {
  const params = useParams();
  const pathname = usePathname();
  const [teamInfo, setTeamInfo] = useState<{
    teamSlug: string | null; // Organization slug
    teamId: string | null; // Organization ID
    teamName: string | null; // Organization name
  }>({
    teamSlug: null,
    teamId: null,
    teamName: null
  });

  useEffect(() => {
    // Check if we're in an organization context from the URL params
    const slugFromParams = params?.slug as string;
    
    // Check if we can get organization info from meta tags (set by middleware)
    const teamSlugMeta = document.querySelector('meta[name="x-team-slug"]')?.getAttribute('content');
    const teamIdMeta = document.querySelector('meta[name="x-team-id"]')?.getAttribute('content');
    const teamNameMeta = document.querySelector('meta[name="x-team-name"]')?.getAttribute('content');
    
    // Or from data attributes on body/html (organization slug stored as team-slug for backward compatibility)
    const bodyElement = document.querySelector('[data-team-slug]');
    const teamSlugFromBody = bodyElement?.getAttribute('data-team-slug');
    
    setTeamInfo({
      teamSlug: teamSlugMeta || teamSlugFromBody || slugFromParams || null,
      teamId: teamIdMeta || null,
      teamName: teamNameMeta || null
    });
  }, [params, pathname]);

  const isTeamContext = !!teamInfo.teamSlug; // Whether in organization context

  const getTeamUrl = (path = '') => {
    if (!teamInfo.teamSlug) return path;
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // In production, use subdomain (organization slug as subdomain)
    if (process.env.NODE_ENV === 'production') {
      const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'https';
      const domain = process.env.NEXT_PUBLIC_DOMAIN || 'have-foresight.app';
      return `${protocol}://${teamInfo.teamSlug}.${domain}/${cleanPath}`;
    }
    
    // In development, use path-based routing (organization slug in path)
    return `/team/${teamInfo.teamSlug}/${cleanPath}`;
  };

  const getMainUrl = (path = '') => {
    const protocol = process.env.NEXT_PUBLIC_PROTOCOL || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const domain = process.env.NEXT_PUBLIC_DOMAIN || (process.env.NODE_ENV === 'production' ? 'have-foresight.app' : 'foresight.local:3000');
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    return `${protocol}://${domain}/${cleanPath}`;
  };

  return {
    teamSlug: teamInfo.teamSlug, // Organization slug for backward compatibility
    teamId: teamInfo.teamId, // Organization ID for backward compatibility
    teamName: teamInfo.teamName, // Organization name for backward compatibility
    isTeamContext, // Whether in organization context
    getTeamUrl, // Get organization-specific URL
    getMainUrl
  };
}