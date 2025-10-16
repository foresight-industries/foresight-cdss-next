'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Mail, Users, LogOut } from 'lucide-react';

export default function NoTeamHome() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({ redirectUrl: '/login' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleJoinTeam = () => {
    router.push('/accept-invitation');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">
                You&apos;re not part of a team yet
              </CardTitle>
              <CardDescription className="mt-2">
                To get started with Foresight RCM, you&apos;ll need to join a team or be invited by your organization.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={handleJoinTeam}
                className="w-full"
                size="lg"
              >
                <Mail className="w-4 h-4 mr-2" />
                Join from Email Invite
              </Button>

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need help? Contact your system administrator or{' '}
                <a
                  href="mailto:team@have-foresight.app"
                  className="text-primary hover:underline"
                >
                  team@have-foresight.app
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
