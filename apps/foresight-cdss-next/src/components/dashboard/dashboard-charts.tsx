'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusDistribution } from '@/components/dashboard/status-distribution';
import type { StatusDistribution as StatusDistributionType } from '@/types/pa.types';
import type { Claim } from '@/data/claims';
import { calculateSubmissionPipelineMetrics } from '@/utils/dashboard';
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
  Cell,
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
  // Calculate submission pipeline metrics if claim data is available
  const submissionMetrics = claimItems.length > 0 ? calculateSubmissionPipelineMetrics(claimItems) : null;
  
  // Prepare submission outcomes data for chart
  const submissionOutcomes = submissionMetrics ? [
    { 
      name: 'Successful Submissions', 
      value: submissionMetrics.totalSubmissionAttempts - submissionMetrics.claimsScrubberRejects,
      color: '#22c55e' 
    },
    { 
      name: 'Scrubber Rejects', 
      value: submissionMetrics.claimsScrubberRejects,
      color: '#ef4444' 
    },
    { 
      name: 'Missing Info', 
      value: submissionMetrics.claimsMissingInfo,
      color: '#f59e0b' 
    }
  ] : [];
  return (
    <Card className={`bg-card border shadow-xs ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <StatusDistribution distribution={statusDistribution} variant="inline" />

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
            <p className="text-xs text-muted-foreground mb-4">Aggregate across automated resubmits</p>
            <ul className="space-y-3">
              {denialReasons.map((item) => (
                <li key={item.reason} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.reason}</span>
                  <span className="font-semibold text-muted-foreground">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Submission Outcomes Chart */}
        {submissionMetrics && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Submission Outcomes</h4>
            <p className="text-xs text-muted-foreground mb-4">Claims pipeline performance with absolute numbers</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionOutcomes} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" tickLine={false} axisLine={false} width={120} />
                  <Tooltip formatter={(value: number) => `${value} claims`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {submissionOutcomes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
