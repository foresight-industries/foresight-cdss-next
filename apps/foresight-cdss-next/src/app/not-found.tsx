'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useOrganization } from '@clerk/nextjs';
import { BackButton } from '@/components/ui/back-button';
import {
  Search,
  Home,
  HelpCircle,
  ShieldAlert,
  Mail
} from 'lucide-react';

export default function NotFound() {
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();
  const [teamBasePath, setTeamBasePath] = useState('');

  // Check if this 404 is from trying to access reset-password without proper params
  // Do this synchronously during initial render to prevent flash
  const isResetPasswordAccess = (() => {
    if (typeof globalThis !== 'undefined' && globalThis.location) {
      const currentPath = globalThis.location.pathname;
      const referer = globalThis.document?.referrer || '';
      return currentPath === '/reset-password' || referer.includes('/reset-password');
    }
    return false;
  })();

  useEffect(() => {
    async function getTeamBasePath() {
      if (isLoaded && user) {
        try {
          // Try to get team slug from current organization first
          if (organization?.slug) {
            setTeamBasePath(`/team/${organization.slug}`);
            return;
          }

          // Fallback: try to extract from current URL if we're on a team page
          const currentPath = globalThis.location.pathname;
          const teamRegex = /^\/team\/([^/]+)/;
          const teamMatch = teamRegex.exec(currentPath);
          if (teamMatch) {
            setTeamBasePath(`/team/${teamMatch[1]}`);
            return;
          }

          // No team context found
          setTeamBasePath('');
        } catch (error) {
          console.error('Error getting team slug:', error);
          setTeamBasePath('');
        }
      } else if (isLoaded && !user) {
        // User not authenticated, use empty path
        setTeamBasePath('');
      }
    }

    getTeamBasePath();
  }, [user, organization, isLoaded]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header with Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/android-chrome-192x192.png"
              alt="Foresight Logo"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Foresight RCM
          </h1>
        </div>

        {/* 404 Content */}
        <div className="text-center space-y-6">
          {isResetPasswordAccess ? (
            /* Reset Password Specific Content */
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-red-100 rounded-full">
                  <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Invalid Password Reset Link
              </h2>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                The password reset link is invalid, expired, or missing required authentication parameters.
              </p>
            </div>
          ) : (
            /* Regular 404 Content */
            <div className="space-y-4">
              <div className="text-8xl font-bold text-gray-300 leading-none">
                404
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Page Not Found
              </h2>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                The page you&apos;re looking for doesn&apos;t exist or may have been moved.
              </p>
            </div>
          )}

          {isResetPasswordAccess ? (
            /* Reset Password Specific Card */
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Mail className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-orange-900 mb-2">
                      Need to reset your password?
                    </h3>
                    <p className="text-orange-800 text-sm mb-4">
                      To reset your password, you&apos;ll need to request a new password reset link from the login page.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="text-orange-700">
                        • Password reset links are only valid for a limited time
                      </div>
                      <div className="text-orange-700">
                        • Links can only be used once for security
                      </div>
                      <div className="text-orange-700">
                        • Make sure to check your spam folder for the reset email
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Regular Search Suggestion */
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Looking for something specific?
                    </h3>
                    <p className="text-blue-800 text-sm mb-4">
                      Try navigating to one of our main sections or return to the dashboard.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <a
                        href={`${teamBasePath}/queue`}
                        className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                      >
                        • Prior Auth
                      </a>
                      <a
                        href={`${teamBasePath}/pre-encounters`}
                        className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                      >
                        • Pre-encounters
                      </a>
                      <a
                        href={`${teamBasePath}/claims`}
                        className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                      >
                        • Claims
                      </a>
                      <a
                        href={`${teamBasePath}/credentialing`}
                        className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                      >
                        • Credentialing
                      </a>
                      <a
                        href={`${teamBasePath}/analytics`}
                        className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                      >
                        • Analytics Dashboard
                      </a>
                      <a
                        href={`${teamBasePath}/settings`}
                        className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                      >
                        • Settings
                      </a>
                      <a
                        href={`${teamBasePath}/billing`}
                        className="text-blue-700 hover:text-blue-900 hover:underline text-left cursor-pointer"
                      >
                        • Billing
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isResetPasswordAccess ? (
              <>
                <Button
                  asChild
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <a href="/login">
                    <Mail className="h-4 w-4" />
                    Go to Login
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <a href="/forgot-password">
                    Request New Reset Link
                  </a>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <a href={teamBasePath || '/'}>
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </a>
                </Button>
                <BackButton />
              </>
            )}
          </div>

          {/* Help Section */}
          <Card className="bg-gray-100 border-gray-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <HelpCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Still can&apos;t find what you need?
                  </h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Our support team is here to help you navigate the platform.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <a
                      href="mailto:team@have-foresight.app?subject=Navigation Help Request"
                      className="flex items-center gap-2"
                    >
                      Contact Support
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
