import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardMetric } from '@/types/pa.types';

interface MetricCardProps {
  metric: DashboardMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {metric.label}
      </p>
      <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {metric.value}
      </p>
      {metric.change && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs',
            metric.change.positive ? 'text-green-600' : 'text-red-600'
          )}
        >
          {metric.change.trend === 'up' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )}
          <span>{metric.change.value}</span>
        </div>
      )}
      {metric.target && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target: {metric.target}</p>
      )}
    </Card>
  );
}