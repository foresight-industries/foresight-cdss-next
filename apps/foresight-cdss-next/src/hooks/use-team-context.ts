'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';

interface TeamContext {
  teamSlug: string | null;
  teamId: string | null;
  teamName: string | null;
  isTeamContext: boolean;
  getTeamUrl: (path?: string) => string;
  getMainUrl: (path?: string) => string;
}

export function useTeamContext(): TeamContext {
  const params = useParams();
  const pathname = usePathname();
  const [teamInfo, setTeamInfo] = useState<{
    teamSlug: string | null;
    teamId: string | null;
    teamName: string | null;
  }>({
    teamSlug: null,
    teamId: null,
    teamName: null
  });

  useEffect(() => {
    // Check if we're in a team context from the URL params
    const slugFromParams = params?.slug as string;
    
    // Check if we can get team info from meta tags (set by middleware)
    const teamSlugMeta = document.querySelector('meta[name="x-team-slug"]')?.getAttribute('content');
    const teamIdMeta = document.querySelector('meta[name="x-team-id"]')?.getAttribute('content');
    const teamNameMeta = document.querySelector('meta[name="x-team-name"]')?.getAttribute('content');
    
    // Or from data attributes on body/html
    const bodyElement = document.querySelector('[data-team-slug]');
    const teamSlugFromBody = bodyElement?.getAttribute('data-team-slug');
    
    setTeamInfo({
      teamSlug: teamSlugMeta || teamSlugFromBody || slugFromParams || null,
      teamId: teamIdMeta || null,
      teamName: teamNameMeta || null
    });
  }, [params, pathname]);

  const isTeamContext = !!teamInfo.teamSlug;

  const getTeamUrl = (path = '') => {
    if (!teamInfo.teamSlug) return path;
    
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // In production, use subdomain
    if (process.env.NODE_ENV === 'production') {
      const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'https';
      const domain = process.env.NEXT_PUBLIC_DOMAIN || 'have-foresight.app';
      return `${protocol}://${teamInfo.teamSlug}.${domain}/${cleanPath}`;
    }
    
    // In development, use path-based routing for now
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
    teamSlug: teamInfo.teamSlug,
    teamId: teamInfo.teamId,
    teamName: teamInfo.teamName,
    isTeamContext,
    getTeamUrl,
    getMainUrl
  };
}