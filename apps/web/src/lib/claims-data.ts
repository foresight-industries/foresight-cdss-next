import { initialClaims } from '@/data/claims';

export interface ClaimsData {
  claims: typeof initialClaims;
  statusCounts: {
    [key: string]: number;
  };
  payerCounts: {
    [key: string]: number;
  };
  totalClaims: number;
  totalValue: number;
}

export async function getClaimsData(): Promise<ClaimsData> {
  // Pre-compute claims analytics on the server
  const claims = initialClaims;
  
  // Calculate status distribution
  const statusCounts = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate payer distribution
  const payerCounts = claims.reduce((acc, claim) => {
    acc[claim.payer.name] = (acc[claim.payer.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total value (mock calculation)
  const totalValue = claims.length * 450; // Average claim value

  return {
    claims,
    statusCounts,
    payerCounts,
    totalClaims: claims.length,
    totalValue
  };
}