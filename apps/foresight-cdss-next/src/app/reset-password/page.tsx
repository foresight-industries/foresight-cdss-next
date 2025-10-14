import { Suspense } from 'react';
import ResetPasswordClient from '@/components/auth/reset-password-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

export default async function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
