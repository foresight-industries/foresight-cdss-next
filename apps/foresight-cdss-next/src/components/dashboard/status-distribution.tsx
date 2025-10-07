import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { StatusDistribution } from '@/types/pa.types';

interface StatusDistributionProps {
  distribution: StatusDistribution;
  variant?: 'card' | 'inline';
  className?: string;
}

const statusConfig = [
  { key: 'needsReview', label: 'Needs review', color: 'bg-amber-400' },
  { key: 'autoProcessing', label: 'Auto-processing', color: 'bg-blue-500' },
  { key: 'autoApproved', label: 'Auto-approved', color: 'bg-green-500' },
  { key: 'denied', label: 'Denied', color: 'bg-red-500' },
];

const StatusDistributionContent = ({ distribution }: { distribution: StatusDistribution }) => {
  const getPercentage = (value: number) => (distribution.total > 0 ? (value / distribution.total) * 100 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {statusConfig.map(({ key, color, label }) => {
          const value = distribution[key as keyof StatusDistribution] as number;
          const percentage = getPercentage(value);

          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function StatusDistribution({ distribution, variant = 'card', className = '' }: StatusDistributionProps) {
  if (variant === 'inline') {
    return (
      <section className={`space-y-4 ${className}`}>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground">Current PA status distribution</h3>
          <p className="text-xs text-muted-foreground">Combined view across ePAs and claims</p>
        </div>
        <StatusDistributionContent distribution={distribution} />
      </section>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Current PA status distribution</CardTitle>
        <span className="text-sm text-muted-foreground">Last updated: Real-time via webhooks</span>
      </CardHeader>
      <CardContent>
        <StatusDistributionContent distribution={distribution} />
      </CardContent>
    </Card>
  );
}