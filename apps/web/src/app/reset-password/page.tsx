import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ResetPasswordClient from '@/components/auth/reset-password-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

interface ResetPasswordPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: Readonly<ResetPasswordPageProps>) {
  const params = await searchParams;

  // Check for required authentication parameters from email link
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const type = params.type;

  // Return 404 if required parameters are missing
  // This prevents the error flash that happens with redirect()
  if (!accessToken || !refreshToken || type !== "recovery") {
    notFound();
  }

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
