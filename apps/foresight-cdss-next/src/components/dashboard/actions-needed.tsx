'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowUpRight, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EpaQueueItem } from '@/data/epa-queue';
import type { Claim } from '@/data/claims';
import type { PreEncounterIssue } from '@/types/pre-encounter.types';
import { getIssueTypeLabel, getIssuePriorityColor } from '@/data/pre-encounter';
import { formatCurrency } from '@/data/claims';

const formatRelativeTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const getClaimSummary = (claim: Claim) => {
  const blockingIssue = claim.issues.find((issue) => issue.severity === 'fail');
  if (blockingIssue) {
    return `${blockingIssue.field.toUpperCase()} · ${blockingIssue.message}`;
  }
  if (claim.suggested_fixes.length > 0) {
    return `${claim.suggested_fixes.length} suggested fix${claim.suggested_fixes.length > 1 ? 'es' : ''}`;
  }
  return 'Review details required';
};

// Helper function to determine if a claim amount is high-value
const isHighValueClaim = (amount: number, allAmounts: number[]) => {
  if (allAmounts.length === 0) return false;
  
  // Sort amounts in descending order and get top 30% threshold
  const sortedAmounts = [...allAmounts].sort((a, b) => b - a);
  const top30PercentIndex = Math.floor(sortedAmounts.length * 0.3);
  const threshold = sortedAmounts[top30PercentIndex] || 0;
  
  // Also consider amounts over $1000 as high value regardless of percentile
  return amount >= threshold || amount >= 1000;
};

const getEpaSummary = (item: EpaQueueItem) => {
  return `${item.medication} · ${item.conditions}`;
};

const getPreEncounterSummary = (issue: PreEncounterIssue) => {
  return `${getIssueTypeLabel(issue.issueType)} · ${issue.payerName}`;
};

interface ActionsNeededCardProps {
  epaItems: EpaQueueItem[];
  claimItems: Claim[];
  preEncounterIssues: PreEncounterIssue[];
}

export function ActionsNeededCard({ epaItems, claimItems, preEncounterIssues }: ActionsNeededCardProps) {
  const params = useParams();
  const teamSlug = params?.slug as string;

  const needsReviewEpa = [...epaItems]
    .filter((item) => item.status === 'needs-review')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const needsReviewClaims = [...claimItems]
    .filter((item) => item.status === 'needs_review')
    .sort((a, b) => {
      // Primary sort: by total_amount (highest first)
      const amountDiff = b.total_amount - a.total_amount;
      if (amountDiff !== 0) return amountDiff;
      
      // Secondary sort: by updated time (most recent first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, 5);

  // Get all claim amounts for high-value determination
  const allClaimAmounts = needsReviewClaims.map(claim => claim.total_amount);

  // Calculate total dollar amount awaiting review
  const totalAwaitingReview = needsReviewClaims.reduce((sum, claim) => sum + claim.total_amount, 0);

  const needsReviewPreEncounter = [...preEncounterIssues]
    .filter((issue) => issue.status === 'pending' || issue.status === 'in_progress')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <Card className="bg-card border border-border/60 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">Actions needed</CardTitle>
        <p className="text-sm text-muted-foreground">Prioritize review queues that require manual attention</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-3">
          <Link href={teamSlug ? `/team/${teamSlug}/claims` : "/claims"} className="group rounded-lg border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40 hover:bg-muted/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Claims — Review queue</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{needsReviewClaims.length > 0 ? `${needsReviewClaims.length} items need review` : 'All caught up'}</span>
                  {totalAwaitingReview > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-medium">{formatCurrency(totalAwaitingReview)} total</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 space-y-3">
              {needsReviewClaims.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions needed</p>
              ) : (
                needsReviewClaims.map((claim) => {
                  const isHighValue = isHighValueClaim(claim.total_amount, allClaimAmounts);
                  return (
                    <div
                      key={claim.id}
                      className={`flex flex-col rounded-md border p-3 transition group-hover:border-primary/30 ${
                        isHighValue 
                          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' 
                          : 'border-border/60 bg-background'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-foreground">{claim.id}</span>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 font-semibold ${
                            isHighValue ? 'text-green-700 dark:text-green-400' : 'text-foreground'
                          }`}>
                            <DollarSign className="w-3 h-3" />
                            <span>{formatCurrency(claim.total_amount)}</span>
                            {isHighValue && <span className="text-green-600 dark:text-green-400">⭐</span>}
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{getClaimSummary(claim)}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{claim.payer.name}</span>
                        <span>{formatRelativeTime(claim.updatedAt)}</span>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          Needs review
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Link>

          <Link href={teamSlug ? `/team/${teamSlug}/queue` : "/queue"} className="group rounded-lg border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40 hover:bg-muted/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Prior auth — Review queue</p>
                <p className="text-xs text-muted-foreground">{needsReviewEpa.length > 0 ? `${needsReviewEpa.length} items need review` : 'All caught up'}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 space-y-3">
              {needsReviewEpa.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions needed</p>
              ) : (
                needsReviewEpa.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-md border border-border/60 bg-background p-3 transition group-hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{item.id}</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(item.updatedAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{getEpaSummary(item)}</p>
                    <div className="mt-3 gap-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.patientName}</span>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          Needs review
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Link>

          <Link href={teamSlug ? `/team/${teamSlug}/pre-encounters` : "/pre-encounters"} className="group rounded-lg border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40 hover:bg-muted/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Pre-encounters — Review queue</p>
                <p className="text-xs text-muted-foreground">{needsReviewPreEncounter.length > 0 ? `${needsReviewPreEncounter.length} issues need review` : 'All caught up'}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 space-y-3">
              {needsReviewPreEncounter.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions needed</p>
              ) : (
                needsReviewPreEncounter.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex flex-col rounded-md border border-border/60 bg-background p-3 transition group-hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{issue.patientName}</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(issue.updatedAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{getPreEncounterSummary(issue)}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{issue.appointmentDate}</span>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={getIssuePriorityColor(issue.priority)}>
                          {issue.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
