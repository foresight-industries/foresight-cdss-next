import { Suspense } from 'react';
import { getCredentialingData } from '@/lib/credentialing-data';
import CredentialingClient from '@/components/credentialing/credentialing-client';
import { CredentialingSkeleton } from '@/components/credentialing/credentialing-skeleton';

export default async function CredentialingPage() {
  const credentialingData = await getCredentialingData();

  return (
    <Suspense fallback={<CredentialingSkeleton />}>
      <CredentialingClient data={credentialingData} />
    </Suspense>
  );
}
