'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';

export function LogoutForm() {
  const { signOut, redirectToSignIn } = useClerk();

  const autoLogout = async () => {
    // Small delay to show the UI briefly
    setTimeout(() => {
      signOut();
      redirectToSignIn();
    }, 500);
  };

  // Auto-trigger logout on component mount for seamless experience
  useEffect(() => {
    autoLogout();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
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
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Foresight RCM
          </h1>
          <p className="text-muted-foreground">
            Signing you out...
          </p>
        </div>

        {/* Logout Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <LogOut className="h-5 w-5" />
              Signing Out
            </CardTitle>
            <CardDescription>
              Please wait while we sign you out of your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading indicator */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-8 h-8 border-4 border-muted rounded-full"></div>
                <div className="absolute top-0 left-0 w-8 h-8 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>

            {/* Cancel button */}
            <Button asChild variant="ghost" className="w-full">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Cancel & Go Back
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>You will be redirected after signing out</p>
        </div>
      </div>
    </div>
  );
}
