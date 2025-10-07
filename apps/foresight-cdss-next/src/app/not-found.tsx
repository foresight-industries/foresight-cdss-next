import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Home,
  ArrowLeft,
  HelpCircle
} from 'lucide-react';

export default function NotFound() {
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
          {/* Large 404 */}
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

          {/* Search Suggestion */}
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
                    <Link
                      href="/queue"
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      • ePA Queue
                    </Link>
                    <Link
                      href="/claims"
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      • Claims Management
                    </Link>
                    <Link
                      href="/analytics"
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      • Analytics Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      • Settings
                    </Link>
                    <Link
                      href="/credentialing"
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      • Credentialing
                    </Link>
                    <Link
                      href="/billing"
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      • Billing
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="flex items-center gap-2"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => window.history.back()}
              size="lg"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
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
                      href="mailto:support@have-foresight.com?subject=Navigation Help Request"
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
