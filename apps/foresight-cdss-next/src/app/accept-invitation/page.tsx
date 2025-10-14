import { Suspense } from 'react';
import AcceptInvitationClient from '@/components/misc/accept-invitation-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

export default async function AcceptInvitationPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AcceptInvitationClient />
    </Suspense>
  );
}
