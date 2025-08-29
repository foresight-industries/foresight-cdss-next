'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Loader2, AlertCircle, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

function ConfirmEmailContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash fragment from the URL which contains the auth tokens
        const hashFragment = window.location.hash.substring(1);
        const params = new URLSearchParams(hashFragment);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (type === 'signup' && accessToken && refreshToken) {
          // Set the session with the tokens from the email link
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error confirming email:', error);
            setError('Failed to confirm email. The link may be invalid or expired.');
          } else {
            setIsSuccess(true);
            // Redirect to dashboard after successful confirmation
            setTimeout(() => {
              router.push('/');
            }, 3000);
          }
        } else if (type === 'recovery') {
          // Handle password reset confirmation - redirect to reset password page
          router.push('/reset-password');
          return;
        } else {
          setError('Invalid confirmation link. Please check the link from your email.');
        }
      } catch (err) {
        console.error('Error during email confirmation:', err);
        setError('An unexpected error occurred during confirmation.');
      } finally {
        setIsLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [router, supabase.auth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <Image
              src="/android-chrome-192x192.png"
              alt="Foresight Logo"
              width={64}
              height={64}
              className="mx-auto rounded-lg"
            />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Confirming your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we verify your email address
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                Confirming your email address...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <Image
              src="/android-chrome-192x192.png"
              alt="Foresight Logo"
              width={64}
              height={64}
              className="mx-auto rounded-lg"
            />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Confirmation failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              There was a problem confirming your email
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertCircle className="mr-2 h-5 w-5" />
                Email confirmation failed
              </CardTitle>
              <CardDescription>
                We couldn't confirm your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </Alert>

              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/login">
                    Try logging in
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <a href="mailto:support@have-foresight.com?subject=Email Confirmation Issue">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <Image
              src="/android-chrome-192x192.png"
              alt="Foresight Logo"
              width={64}
              height={64}
              className="mx-auto rounded-lg"
            />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Email confirmed!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome to Foresight PA Automation
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Account activated
              </CardTitle>
              <CardDescription>
                Your email has been confirmed and your account is now active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="p-4">
                <CheckCircle className="h-4 w-4" />
                <p>
                  Your account has been successfully activated. You will be redirected to the dashboard shortly.
                </p>
              </Alert>

              <Button asChild className="w-full">
                <Link href="/">
                  Go to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2025 Foresight Industries. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}