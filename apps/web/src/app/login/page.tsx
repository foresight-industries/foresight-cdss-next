import { Suspense } from 'react';
import LoginClient from '@/components/auth/login-client';
import AuthSkeleton from '@/components/skeletons/auth-skeleton';

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: Readonly<LoginPageProps>) {
  const params = await searchParams;
  const errorParam = params.error;

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginClient
        error={typeof errorParam === "string" ? errorParam : undefined}
      />
    </Suspense>
  );
}
