'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

export default function SignupClient() {
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
            Create an account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Foresight RCM platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Registration</CardTitle>
            <CardDescription>
              New accounts are created by administrators only
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="p-4">
              <p>
                To request access to the Foresight RCM platform, please contact your system administrator or reach out to our support team.
              </p>
            </Alert>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="mailto:support@have-foresight.com?subject=Account Access Request&body=Hello, I would like to request access to the Foresight RCM platform.">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </div>
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