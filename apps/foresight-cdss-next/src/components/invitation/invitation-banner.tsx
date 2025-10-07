'use client';

import { useState } from 'react';
import { useInvitation } from '@/hooks/use-invitation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  X,
  Mail,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface InvitationBannerProps {
  variant?: 'banner' | 'card' | 'modal';
  className?: string;
}

export function InvitationBanner({ variant = 'banner', className = '' }: InvitationBannerProps) {
  const {
    status,
    invitationInfo,
    error,
    hasInvitation,
    isReady,
    acceptInvitation,
    dismissInvitation,
    redirectToAcceptPage
  } = useInvitation();

  const [isAccepting, setIsAccepting] = useState(false);

  // Don't render if no invitation
  if (!hasInvitation || status === 'none') {
    return null;
  }

  const handleAccept = async () => {
    setIsAccepting(true);
    const success = await acceptInvitation();
    setIsAccepting(false);

    if (success) {
      // Optionally show success message or redirect
      window.location.href = '/dashboard';
    }
  };

  const handleGoToAcceptPage = () => {
    redirectToAcceptPage();
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Loading invitation details...
            </p>
          </div>
        </div>
      );
    }

    if (status === 'error' || status === 'expired') {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                {status === 'expired' ? 'Invitation Expired' : 'Invitation Error'}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {error || 'There was a problem with your invitation.'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={dismissInvitation}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (isReady) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                You&apos;re invited to join {invitationInfo.organizationName}
              </p>
              <div className="flex items-center space-x-4 mt-1">
                {invitationInfo.inviterName && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Invited by {invitationInfo.inviterName}
                  </p>
                )}
                {invitationInfo.role && (
                  <Badge variant="outline" className="text-xs">
                    {invitationInfo.role}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {variant === 'banner' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToAcceptPage}
                  className="flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="flex items-center space-x-1"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Accepting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      <span>Accept</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleGoToAcceptPage}
                className="flex items-center space-x-1"
              >
                <span>Accept Invitation</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={dismissInvitation}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  if (variant === 'card') {
    return (
      <Card className={`p-4 ${className}`}>
        {renderContent()}
      </Card>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-400 p-4 ${className}`}>
        {renderContent()}
      </div>
    );
  }

  // Default banner style
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-xs border-b p-4 ${className}`}>
      {renderContent()}
    </div>
  );
}
