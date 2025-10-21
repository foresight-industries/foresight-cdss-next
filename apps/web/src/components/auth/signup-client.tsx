'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupClient() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <Image
            src="/android-chrome-192x192.png"
            alt="Foresight Logo"
            width={64}
            height={64}
            className="mx-auto rounded-lg"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
          <CardContent className="space-y-8">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                To request access to the Foresight RCM platform, please contact your system administrator or reach out to our support team.
              </p>
            </div>

            <div className="space-y-6">
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

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; 2025 Foresight Industries. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
