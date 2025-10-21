import { Suspense } from 'react';
import ConfirmEmailClient from '@/components/auth/confirm-email-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

export default async function ConfirmEmailPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ConfirmEmailClient />
    </Suspense>
  );
}
