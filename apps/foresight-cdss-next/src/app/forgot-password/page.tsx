import { Suspense } from 'react';
import ForgotPasswordClient from '@/components/auth/forgot-password-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

export default async function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
