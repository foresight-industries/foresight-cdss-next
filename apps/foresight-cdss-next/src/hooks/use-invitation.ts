"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export interface InvitationInfo {
  token?: string;
  invitationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  inviterName?: string;
  role?: string;
  email?: string;
}

export type InvitationStatus =
  | 'none'
  | 'detected'
  | 'loading'
  | 'ready'
  | 'error'
  | 'expired';

export function useInvitation() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<InvitationStatus>('none');
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo>({});
  const [error, setError] = useState<string | null>(null);

  // Check for invitation parameters in URL
  const hasInvitationParams = () => {
    const token = searchParams.get('__clerk_invitation_token');
    const invitationId = searchParams.get('__clerk_invitation_id');
    return !!(token || invitationId);
  };

  useEffect(() => {
    if (!isLoaded) return;

    // Check if there are invitation parameters in the URL
    if (hasInvitationParams()) {
      const token = searchParams.get('__clerk_invitation_token');
      const invitationId = searchParams.get('__clerk_invitation_id');

      setInvitationInfo({
        token: token || undefined,
        invitationId: invitationId || undefined,
      });

      setStatus('detected');

      // If user is not signed in, redirect to login page with the current URL
      if (!user) {
        const currentUrl = globalThis.location.href;
        router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
        return;
      }

      // If user is signed in, load invitation details
      loadInvitationDetails(token, invitationId);
    } else {
      setStatus('none');
    }
  }, [isLoaded, user, searchParams]);

  const loadInvitationDetails = async (token?: string | null, invitationId?: string | null) => {
    if (!token && !invitationId) return;

    try {
      setStatus('loading');
      setError(null);

      const response = await fetch(`/api/invitations/details?token=${token || ''}&invitationId=${invitationId || ''}`);

      if (!response.ok) {
        if (response.status === 404) {
          setStatus('expired');
          setError('This invitation link is no longer valid or has expired.');
          return;
        }
        throw new Error('Failed to load invitation details');
      }

      const data = await response.json();

      setInvitationInfo(prev => ({
        ...prev,
        organizationName: data.organizationName,
        inviterName: data.inviterName,
        role: data.role,
        email: data.email,
      }));

      // Check if invitation email matches user email
      if (user && data.email && user.emailAddresses[0]?.emailAddress !== data.email) {
        setStatus('error');
        setError(`This invitation is for ${data.email}, but you're signed in as ${user.emailAddresses[0]?.emailAddress}.`);
        return;
      }

      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load invitation details');
    }
  };

  const acceptInvitation = async (): Promise<{ success: boolean; organizationSlug?: string }> => {
    try {
      setError(null);

      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: invitationInfo.token,
          invitationId: invitationInfo.invitationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      const data = await response.json();

      // Clear invitation parameters from URL
      const url = new URL(globalThis.location.href);
      url.searchParams.delete('__clerk_invitation_token');
      url.searchParams.delete('__clerk_invitation_id');
      router.replace(url.pathname + url.search);

      setStatus('none');
      setInvitationInfo({});

      return { success: true, organizationSlug: data.organizationSlug };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      return { success: false };
    }
  };

  const dismissInvitation = () => {
    // Clear invitation parameters from URL
    const url = new URL(globalThis.location.href);
    url.searchParams.delete('__clerk_invitation_token');
    url.searchParams.delete('__clerk_invitation_id');
    router.replace(url.pathname + url.search);

    setStatus('none');
    setInvitationInfo({});
    setError(null);
  };

  const redirectToAcceptPage = () => {
    const currentUrl = globalThis.location.href;
    router.push(`/accept-invitation?${new URL(currentUrl).search}`);
  };

  return {
    // State
    status,
    invitationInfo,
    error,
    hasInvitation: status !== 'none',
    isReady: status === 'ready',
    isLoading: status === 'loading',

    // Actions
    acceptInvitation: acceptInvitation as () => Promise<{ success: boolean; organizationSlug?: string }>,
    dismissInvitation,
    redirectToAcceptPage,
    refreshDetails: () => loadInvitationDetails(invitationInfo.token, invitationInfo.invitationId),
  };
}
