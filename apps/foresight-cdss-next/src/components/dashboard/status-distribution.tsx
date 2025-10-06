import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { StatusDistribution } from '@/types/pa.types';

interface StatusDistributionProps {
  distribution: StatusDistribution;
}

const statusConfig = [
  { key: 'needsReview', label: 'Needs Review', color: 'bg-amber-400' },
  { key: 'autoProcessing', label: 'Auto-Processing', color: 'bg-blue-500' },
  { key: 'autoApproved', label: 'Auto-Approved', color: 'bg-green-500' },
  { key: 'denied', label: 'Denied', color: 'bg-red-500' },
];

export function StatusDistribution({ distribution }: StatusDistributionProps) {
  const getPercentage = (value: number) => {
    return distribution.total > 0 ? (value / distribution.total) * 100 : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current PA Status Distribution</CardTitle>
        <span className="text-sm text-muted-foreground">
          Last updated: Real-time via webhooks
        </span>
      </CardHeader>
      <CardContent>
        {/* Status Bars */}
        <div className="flex gap-4 mb-4">
          {statusConfig.map(({ key, color }) => {
            const value = distribution[key as keyof StatusDistribution] as number;
            const percentage = getPercentage(value);
            
            return (
              <div key={key} className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6">
          {statusConfig.map(({ key, label, color }) => {
            const value = distribution[key as keyof StatusDistribution] as number;
            
            return (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-sm text-muted-foreground">
                  {label} ({value})
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}