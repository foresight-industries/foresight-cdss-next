import { Suspense } from 'react';
import OnboardingClient from '@/components/misc/onboarding-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

export default async function OnboardPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <OnboardingClient />
    </Suspense>
  );
}
