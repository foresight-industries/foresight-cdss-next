'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  RotateCcw,
  Home,
  Bug,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Foresight RCM
          </h1>
          <p className="text-muted-foreground">
            Something went wrong with your request
          </p>
        </div>

        {/* Error Card */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-red-900 mb-2">
                  Application Error
                </h2>
                <p className="text-red-800 mb-4">
                  We encountered an unexpected error while processing your request.
                  Our team has been automatically notified and is working to resolve the issue.
                </p>

                {/* Error Details (Development Mode) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-red-900 hover:text-red-700">
                      Technical Details (Development Mode)
                    </summary>
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 rounded border text-sm font-mono text-red-800 dark:text-red-200 overflow-auto">
                      <p className="mb-2"><strong>Error:</strong> {error.message}</p>
                      {error.digest && (
                        <p className="mb-2"><strong>Error ID:</strong> {error.digest}</p>
                      )}
                      {error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="flex items-center gap-2"
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>

          <Button
            variant="outline"
            asChild
            size="lg"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <HelpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Need Help?
                </h3>
                <p className="text-blue-800 text-sm mb-4">
                  If this error persists, please contact our support team with the error details.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Link
                      href="mailto:support@have-foresight.com?subject=Application Error Report"
                      className="flex items-center gap-2"
                    >
                      <Bug className="h-4 w-4" />
                      Report Issue
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Link
                      href="/settings?section=help"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Help Center
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Error occurred at {new Date().toLocaleString()}
          </p>
          {error.digest && (
            <p className="mt-1">
              Reference ID: <code className="font-mono bg-muted px-1 rounded">{error.digest}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
