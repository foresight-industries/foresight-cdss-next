import { Suspense } from 'react';
import SignupClient from '@/components/auth/signup-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

export default async function SignupPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <SignupClient />
    </Suspense>
  );
}
