import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TeamNotFoundProps {
  searchParams?: { slug?: string };
}

export default function TeamNotFound({ searchParams }: TeamNotFoundProps) {
  const attemptedSlug = searchParams?.slug;

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

        {/* Error Content */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-orange-900 mb-2">
                  Team Not Found
                </h2>
                {attemptedSlug ? (
                  <p className="text-orange-800 mb-4">
                    We couldn&apos;t find a team with the identifier &quot;<strong>{attemptedSlug}</strong>&quot;.
                    This team may not exist, may be inactive, or you may not have access to it.
                  </p>
                ) : (
                  <p className="text-orange-800 mb-4">
                    The team you&apos;re looking for doesn&apos;t exist or may be inactive.
                  </p>
                )}

                <div className="space-y-3">
                  <h3 className="font-medium text-orange-900">Possible reasons:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
                    <li>The team URL was typed incorrectly</li>
                    <li>The team has been deactivated or deleted</li>
                    <li>You don&apos;t have permission to access this team</li>
                    <li>The team identifier has changed</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go to Main Site
            </Link>
          </Button>

          <Button variant="outline" asChild size="lg">
            <a
              href="mailto:support@have-foresight.com?subject=Team Access Issue"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
          </Button>
        </div>

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Need Help Finding Your Team?
              </h3>
              <p className="text-blue-800 text-sm mb-4">
                If you believe you should have access to this team, please contact your team administrator
                or reach out to our support team with the team identifier.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Link href="/support">
                    View Help Center
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Link href="/login">
                    Try Logging In
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          {attemptedSlug && (
            <p className="mb-2">
              Attempted team: <code className="font-mono bg-gray-100 px-1 rounded">{attemptedSlug}</code>
            </p>
          )}
          <p>
            Occurred at {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
