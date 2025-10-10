'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { StatusDistribution as StatusDistributionType } from '@/types/pa.types';
import type { Claim } from '@/data/claims';
import { calculateSubmissionPipelineMetrics } from '@/utils/dashboard';
import { getTopDenialReasons, analyzeDenialReasons, type DenialReasonAnalysis } from '@/data/denial-reasons';
import { DenialReasonDetail } from '@/components/analytics/denial-reason-detail';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsOverviewProps {
  statusDistribution: StatusDistributionType;
  claimItems?: Claim[];
  className?: string;
}

const volumeTrend = [
  { month: 'May', epa: 46, claims: 28 },
  { month: 'Jun', epa: 58, claims: 35 },
  { month: 'Jul', epa: 67, claims: 41 },
  { month: 'Aug', epa: 72, claims: 44 },
  { month: 'Sep', epa: 81, claims: 49 },
  { month: 'Oct', epa: 89, claims: 53 },
];

const denialReasons = [
  { reason: 'Missing indication detail', count: 14 },
  { reason: 'Eligibility not verified', count: 9 },
  { reason: 'Incorrect POS/modifiers', count: 7 },
  { reason: 'Expired authorization', count: 5 },
];

const automationQuality = [
  { month: 'May', automation: 82, quality: 92 },
  { month: 'Jun', automation: 85, quality: 93 },
  { month: 'Jul', automation: 87, quality: 94 },
  { month: 'Aug', automation: 88, quality: 95 },
  { month: 'Sep', automation: 90, quality: 95 },
  { month: 'Oct', automation: 91, quality: 96 },
];

export function AnalyticsOverview({ statusDistribution, claimItems = [], className = '' }: AnalyticsOverviewProps) {
  const [selectedDenialReason, setSelectedDenialReason] = useState<DenialReasonAnalysis | null>(null);

  // Calculate submission pipeline metrics if claim data is available
  const submissionMetrics = claimItems.length > 0 ? calculateSubmissionPipelineMetrics(claimItems) : null;

  // Calculate denial reason analyses from actual claim data
  const denialReasonAnalyses = useMemo(() => {
    return claimItems.length > 0 ? analyzeDenialReasons(claimItems) : [];
  }, [claimItems]);

  // Get top denial reasons for display
  const topDenialReasons = useMemo(() => {
    return claimItems.length > 0 ? getTopDenialReasons(claimItems, 4) : denialReasons;
  }, [claimItems]);

  // Prepare submission outcomes data for chart
  const submissionOutcomes = submissionMetrics ? [
    {
      category: 'Successful',
      value: submissionMetrics.totalSubmissionAttempts - submissionMetrics.claimsScrubberRejects,
      fill: 'var(--color-successful)'
    },
    {
      category: 'Scrubber Rejects',
      value: submissionMetrics.claimsScrubberRejects,
      fill: 'var(--color-rejects)'
    },
    {
      category: 'Missing Info',
      value: submissionMetrics.claimsMissingInfo,
      fill: 'var(--color-missing)'
    }
  ] : [];

  const submissionChartConfig = {
    value: {
      label: "Claims",
    },
    successful: {
      label: "Successful",
      color: "hsl(142 76% 36%)",
    },
    rejects: {
      label: "Scrubber Rejects",
      color: "hsl(0 84% 60%)",
    },
    missing: {
      label: "Missing Info",
      color: "hsl(43 96% 56%)",
    },
  } satisfies ChartConfig;

  const handleDenialReasonClick = (reasonCode: string) => {
    const analysis = denialReasonAnalyses.find(a => a.reason.code === reasonCode);
    if (analysis) {
      setSelectedDenialReason(analysis);
    }
  };

  const handleAutomateAction = (action: string) => {
    // TODO: Implement automation logic
    console.log('Automating action:', action);
    toast.info(`Automation started: ${action}`);
  };

  // If a denial reason is selected, show the detail view
  if (selectedDenialReason) {
    return (
      <Card className={`bg-card border shadow-xs ${className}`}>
        <CardContent className="p-6">
          <DenialReasonDetail
            analysis={selectedDenialReason}
            onBack={() => setSelectedDenialReason(null)}
            onAutomate={handleAutomateAction}
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className={`bg-card border shadow-xs ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Volume trends (last 6 months)</h4>
            <p className="text-xs text-muted-foreground mb-4">Stacked view of ePA and claim throughput</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeTrend} stackOffset="expand">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#6b7280" />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => `${value} items`} />
                  <Legend />
                  <Bar dataKey="epa" name="ePA volume" stackId="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="claims" name="Claims volume" stackId="total" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Top denial reasons</h4>
            <p className="text-xs text-muted-foreground mb-4">Click on any reason for detailed analysis and resolution guidance</p>
            <ul className="space-y-3">
              {topDenialReasons.map((item) => {
                const hasCode = 'code' in item && typeof item.code === 'string';
                const isClickable = hasCode && denialReasonAnalyses.some(a => a.reason.code === item.code);
                const handleClick = () => {
                  if (isClickable && hasCode) {
                    handleDenialReasonClick(item.code as string);
                  }
                };

                if (isClickable) {
                  return (
                    <li key={item.reason}>
                      <button
                        className="w-full flex items-center justify-between text-sm p-2 rounded-md transition-colors border border-transparent hover:bg-muted/50 hover:border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left"
                        onClick={handleClick}
                        aria-label={`View details for ${item.reason}`}
                      >
                        <span className="text-foreground hover:text-primary">
                          {item.reason}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-muted-foreground">{item.count}</span>
                          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    </li>
                  );
                } else {
                  return (
                    <li key={item.reason} className="flex items-center justify-between text-sm p-2">
                      <span className="text-foreground">{item.reason}</span>
                      <span className="font-semibold text-muted-foreground">{item.count}</span>
                    </li>
                  );
                }
              })}
            </ul>
            {denialReasonAnalyses.length === 0 && claimItems.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4 italic">
                No denial patterns found in current data
              </p>
            )}
          </div>
        </div>

        {/* Submission Outcomes Chart */}
        {submissionMetrics && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Submission Outcomes</h4>
            <p className="text-xs text-muted-foreground mb-4">Claims pipeline performance with absolute numbers</p>
            <ChartContainer config={submissionChartConfig}>
              <BarChart
                accessibilityLayer
                data={submissionOutcomes}
                layout="vertical"
                margin={{ left: 20 }}
                barCategoryGap="20%"
              >
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={true}
                />
                <XAxis dataKey="value" type="number" axisLine={true} tickLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" layout="vertical" radius={5} maxBarSize={20} />
              </BarChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="font-medium">Successful</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {submissionMetrics.totalSubmissionAttempts - submissionMetrics.claimsScrubberRejects} claims
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="font-medium">Scrub Rejects</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {submissionMetrics.claimsScrubberRejects} claims
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded"></div>
                  <span className="font-medium">Missing Info</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {submissionMetrics.claimsMissingInfo} claims
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Automation & quality over time</h4>
          <p className="text-xs text-muted-foreground mb-4">Rolling averages for automation rate and documentation quality</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={automationQuality}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tickLine={false} axisLine={false} domain={[70, 100]} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="automation" name="Automation rate" stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="quality" name="Quality score" stroke="#14b8a6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
