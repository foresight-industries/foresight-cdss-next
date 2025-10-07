'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EpaQueueItem } from '@/data/epa-queue';
import type { Claim } from '@/data/claims';

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

const getEpaSummary = (item: EpaQueueItem) => {
  return `${item.medication} · ${item.conditions}`;
};

interface ActionsNeededCardProps {
  epaItems: EpaQueueItem[];
  claimItems: Claim[];
}

export function ActionsNeededCard({ epaItems, claimItems }: ActionsNeededCardProps) {
  const needsReviewEpa = [...epaItems]
    .filter((item) => item.status === 'needs-review')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const needsReviewClaims = [...claimItems]
    .filter((item) => item.status === 'needs_review')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <Card className="bg-card border shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">Actions needed</CardTitle>
        <p className="text-sm text-muted-foreground">Prioritize review queues that require manual attention</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/claims" className="group rounded-lg border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40 hover:bg-muted/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Claims — Review queue</p>
                <p className="text-xs text-muted-foreground">{needsReviewClaims.length > 0 ? `${needsReviewClaims.length} items need review` : 'All caught up'}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" aria-hidden="true" />
            </div>
            <div className="mt-4 space-y-3">
              {needsReviewClaims.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions needed</p>
              ) : (
                needsReviewClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col rounded-md border border-border/60 bg-background p-3 transition group-hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{claim.id}</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(claim.updatedAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{getClaimSummary(claim)}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{claim.payer.name}</span>
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        Needs review
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Link>

          <Link href="/queue" className="group rounded-lg border border-border/60 bg-muted/20 p-4 transition hover:border-primary/40 hover:bg-muted/30">
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
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.patientName}</span>
                      <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                        {item.confidence}% confidence
                      </Badge>
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
