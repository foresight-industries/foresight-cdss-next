'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useOrganizationList } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Mail, Building2 } from 'lucide-react';

type InvitationStatus = 'loading' | 'pending' | 'accepting' | 'success' | 'error' | 'expired' | 'already-accepted';

export default function AcceptInvitationPage() {
  const { user, isLoaded } = useUser();
  const { userMemberships, isLoaded: membershipsLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const { setActive } = useOrganizationList();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<InvitationStatus>('loading');
  const [invitationData, setInvitationData] = useState<{
    organizationName?: string;
    inviterName?: string;
    role?: string;
    email?: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Get invitation parameters from URL
  const invitationToken = searchParams.get('__clerk_invitation_token');
  const invitationId = searchParams.get('__clerk_invitation_id');

  useEffect(() => {
    if (!isLoaded || !membershipsLoaded) return;

    // Check if user is already signed in and has accepted invitations
    if (user && invitationToken) {
      checkInvitationStatus();
    } else if (!user) {
      // User needs to sign in first
      setStatus('pending');
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`);
    }
  }, [isLoaded, membershipsLoaded, user, invitationToken]);

  const checkInvitationStatus = async () => {
    try {
      setStatus('loading');

      // Check if invitation is already accepted by looking at user's memberships
      if (userMemberships?.data) {
        const hasExistingMembership = userMemberships.data.some(membership =>
          membership.organization.publicMetadata?.invitation_token === invitationToken
        );

        if (hasExistingMembership) {
          setStatus('already-accepted');
          return;
        }
      }

      // Fetch invitation details from our API
      const response = await fetch(`/api/invitations/details?token=${invitationToken}`);

      if (!response.ok) {
        if (response.status === 404) {
          setStatus('expired');
          setErrorMessage('This invitation link is no longer valid or has expired.');
          return;
        }
        throw new Error('Failed to fetch invitation details');
      }

      const data = await response.json();
      setInvitationData({
        organizationName: data.organizationName,
        inviterName: data.inviterName,
        role: data.role,
        email: data.email,
      });

      // Check if the invitation matches user's email
      if (user?.emailAddresses[0]?.emailAddress !== data.email) {
        setStatus('error');
        setErrorMessage(`This invitation is for ${data.email}, but you're signed in as ${user?.emailAddresses[0]?.emailAddress}. Please sign in with the correct email address.`);
        return;
      }

      setStatus('pending');
    } catch (error) {
      console.error('Error checking invitation status:', error);
      setStatus('error');
      setErrorMessage('Failed to load invitation details. Please try again.');
    }
  };

  const acceptInvitation = async () => {
    try {
      setStatus('accepting');

      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: invitationToken,
          invitationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      const result = await response.json();

      // Set the new organization as active
      if (result.organizationId && setActive) {
        await setActive({ organization: result.organizationId });
      }

      setStatus('success');

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to accept invitation');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Loading invitation...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your invitation.
            </p>
          </div>
        );

      case 'pending':
        return (
          <div className="py-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                You&apos;re Invited!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You&apos;ve been invited to join an organization.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization:</span>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {invitationData.organizationName || 'Loading...'}
                  </span>
                </div>
              </div>

              {invitationData.inviterName && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Invited by:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {invitationData.inviterName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Role:</span>
                <Badge variant="outline">
                  {invitationData.role || 'Member'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
                <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {invitationData.email || user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            </div>

            <Button onClick={acceptInvitation} className="w-full" size="lg">
              Accept Invitation
            </Button>
          </div>
        );

      case 'accepting':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Accepting invitation...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we add you to the organization.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to the team!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You&apos;ve successfully joined {invitationData.organizationName}.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting you to the dashboard...
            </p>
          </div>
        );

      case 'already-accepted':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Already a member
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You&apos;re already a member of this organization.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        );

      case 'expired':
      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {status === 'expired' ? 'Invitation Expired' : 'Something went wrong'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errorMessage}
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
                Go to Dashboard
              </Button>
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        {renderContent()}
      </Card>
    </div>
  );
}
