import { Suspense } from 'react';
import LoginClient from '@/components/auth/login-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

export default async function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}
