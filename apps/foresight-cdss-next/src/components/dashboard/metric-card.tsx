import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { DashboardMetric } from '@/types/pa.types';

interface MetricCardProps {
  metric: DashboardMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const cardContent = (
    <Card className="p-6 transition-all duration-150 ease-in-out hover:translate-y-[-2px] hover:shadow-lg bg-card border shadow-xs">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">
        {metric.label}
      </h3>
      <p className="text-3xl font-bold mt-1 mb-2 text-foreground">
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
        <p className="text-xs text-muted-foreground mt-1">Target: {metric.target}</p>
      )}
    </Card>
  );

  if (metric.tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{metric.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}