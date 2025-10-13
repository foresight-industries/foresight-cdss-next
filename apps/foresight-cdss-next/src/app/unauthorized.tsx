'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  ShieldX,
  Home,
  LogOut,
  Mail,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

export default function UnauthorizedPage() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
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
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Foresight RCM
          </h1>
        </div>

        {/* Main Unauthorized Card */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-red-900">
              Access Denied
            </CardTitle>
            <CardDescription className="text-red-700 text-base">
              You don&apos;t have permission to access this resource
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-white/60 rounded-lg p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 mb-1">
                    Why am I seeing this?
                  </h3>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• You may not be a member of this team</li>
                    <li>• Your account permissions may have changed</li>
                    <li>• The resource may require additional access levels</li>
                  </ul>
                </div>
              </div>
            </div>

            {user && (
              <div className="bg-white/60 rounded-lg p-4 border border-red-200">
                <div className="text-sm">
                  <span className="text-red-700">Signed in as:</span>
                  <br />
                  <span className="font-medium text-red-900">
                    {user.primaryEmailAddress?.emailAddress || 'Unknown user'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleGoBack}
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Link>
          </Button>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            size="lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Help Section */}
        <Card className="bg-gray-100 border-gray-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Need Help?
              </h3>
              <p className="text-gray-700 text-sm mb-4">
                If you believe this is an error, contact your system administrator
                or reach out to our support team for assistance.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <a
                    href="mailto:team@have-foresight.app?subject=Access Issue - Unauthorized Page"
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Support
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            � 2025 Foresight Industries. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
