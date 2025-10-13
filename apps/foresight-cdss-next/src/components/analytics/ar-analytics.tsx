'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, TrendingUp, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { Claim } from '@/data/claims';
import type { RCMMetrics } from '@/utils/dashboard';

interface ARAnalyticsProps {
  claims: Claim[];
  rcmMetrics: RCMMetrics;
  className?: string;
}

// Helper function to calculate days between two dates
const daysBetween = (startDate: string, endDate: Date): number => {
  const start = new Date(startDate);
  const diffTime = endDate.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Mock trend data (placeholder - would come from historical data)
const arTrendData = [
  { month: 'May', avgDays: 52, totalAR: 145000 },
  { month: 'Jun', avgDays: 48, totalAR: 138000 },
  { month: 'Jul', avgDays: 45, totalAR: 142000 },
  { month: 'Aug', avgDays: 44, totalAR: 134000 },
  { month: 'Sep', avgDays: 42, totalAR: 128000 },
  { month: 'Oct', avgDays: 39, totalAR: 125000 },
];

export function ARAnalytics({
  claims,
  rcmMetrics,
  className = "",
}: Readonly<ARAnalyticsProps>) {
  const params = useParams();
  const teamSlug = params?.slug as string;

  // State for tracking which collapsible sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "90+": true, // Default open for critical bucket
  });

  // Get outstanding claims for analysis
  const outstandingClaims = useMemo(() => {
    return claims.filter((claim) => !["paid", "denied"].includes(claim.status));
  }, [claims]);

  // Calculate aging buckets by count (not just amount)
  const agingCountBuckets = useMemo(() => {
    const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    const now = new Date();

    for (const claim of outstandingClaims) {
      const daysOld = daysBetween(claim.dos, now);
      if (daysOld <= 30) {
        buckets["0-30"]++;
      } else if (daysOld <= 60) {
        buckets["31-60"]++;
      } else if (daysOld <= 90) {
        buckets["61-90"]++;
      } else {
        buckets["90+"]++;
      }
    }

    return buckets;
  }, [outstandingClaims]);

  // Get longest outstanding claims
  const longestClaims = useMemo(() => {
    const now = new Date();
    return outstandingClaims
      .map((claim) => ({
        ...claim,
        daysOutstanding: daysBetween(claim.dos, now),
      }))
      .sort((a, b) => b.daysOutstanding - a.daysOutstanding)
      .slice(0, 10);
  }, [outstandingClaims]);

  // Prepare chart data for aging distribution
  const distributionData = [
    {
      bucket: "0-30",
      count: agingCountBuckets["0-30"],
      amount: rcmMetrics.agingBuckets["0-30"],
    },
    {
      bucket: "31-60",
      count: agingCountBuckets["31-60"],
      amount: rcmMetrics.agingBuckets["31-60"],
    },
    {
      bucket: "61-90",
      count: agingCountBuckets["61-90"],
      amount: rcmMetrics.agingBuckets["61-90"],
    },
    {
      bucket: "90+",
      count: agingCountBuckets["90+"],
      amount: rcmMetrics.agingBuckets["90+"],
    },
  ];

  // Generate insights with aging-specific recommendations
  const insights = useMemo(() => {
    const insights: string[] = [];
    const totalOutstanding = rcmMetrics.totalOutstandingAR;
    const oldestBucketPct =
      totalOutstanding > 0
        ? (rcmMetrics.agingBuckets["90+"] / totalOutstanding) * 100
        : 0;
    const oldBucketsPct =
      totalOutstanding > 0
        ? ((rcmMetrics.agingBuckets["61-90"] + rcmMetrics.agingBuckets["90+"]) /
            totalOutstanding) *
          100
        : 0;

    // Critical aging issues
    if (rcmMetrics.maxDaysOutstanding && rcmMetrics.maxDaysOutstanding > 90) {
      insights.push(
        `Urgent: Claims outstanding for ${rcmMetrics.maxDaysOutstanding} days require immediate attention.`
      );
    }

    if (rcmMetrics.agingBuckets["90+"] > 0) {
      insights.push(
        `Critical aging: ${formatCurrency(
          rcmMetrics.agingBuckets["90+"]
        )} in 90+ days bucket (${
          rcmMetrics.agingCounts["90+"]
        } claims) - prioritize follow-up.`
      );
    }

    if (oldestBucketPct > 20) {
      insights.push(
        `High concern: ${oldestBucketPct.toFixed(
          1
        )}% of total A/R is aging 90+ days - investigate potential collection issues.`
      );
    }

    if (oldBucketsPct > 40) {
      insights.push(
        `${oldBucketsPct.toFixed(
          1
        )}% of A/R is older than 60 days - review collection processes and payer relationships.`
      );
    }

    if (rcmMetrics.daysInAR && rcmMetrics.daysInAR > 40) {
      insights.push(
        `Average Days in A/R (${rcmMetrics.daysInAR}) exceeds target of 40 days.`
      );
    }

    // Payer-specific insights for aging buckets
    const payerAnalysis = outstandingClaims.reduce((acc, claim) => {
      const days = daysBetween(claim.dos, new Date());
      if (days > 90) {
        const payer = claim.payer.name;
        if (!acc[payer]) acc[payer] = { count: 0, amount: 0 };
        acc[payer].count++;
        acc[payer].amount += claim.total_amount;
      }
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const topProblemPayer = Object.entries(payerAnalysis).sort(
      ([, a], [, b]) => b.amount - a.amount
    )[0];

    if (topProblemPayer && topProblemPayer[1].count >= 3) {
      insights.push(
        `${topProblemPayer[0]} has ${
          topProblemPayer[1].count
        } claims in 90+ days totaling ${formatCurrency(
          topProblemPayer[1].amount
        )} - investigate payer issues.`
      );
    }

    if (insights.length === 0) {
      insights.push("A/R performance is within acceptable ranges.");
    }

    return insights;
  }, [rcmMetrics, outstandingClaims]);

  if (outstandingClaims.length === 0) {
    return (
      <section
        id="ar-details"
        role="region"
        className={`space-y-6 ${className}`}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Accounts Receivable Details
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analysis of outstanding receivables
          </p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-100 p-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  No Outstanding Claims
                </h3>
                <p className="text-sm text-muted-foreground">
                  All claims have been paid or resolved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="ar-details" role="region" className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Accounts Receivable Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive analysis of outstanding receivables
        </p>
      </div>

      {/* Insights/Recommendations */}
      {insights.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="space-y-1">
              {insights.map((insight, index) => (
                <p key={index} className="text-sm text-amber-800">
                  {insight}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A/R Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              A/R Trend (Last 6 Months)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Historical average days in accounts receivable
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={arTrendData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    stroke="#6b7280"
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#6b7280"
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} days`, "Avg Days"]}
                  />
                  <Line
                    dataKey="avgDays"
                    type="monotone"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#4f46e5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution by Count and Amount */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Aging Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Number of claims and dollar amount by aging bucket
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                    className="dark:stroke-gray-600"
                  />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={false}
                    stroke="#6b7280"
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#6b7280"
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} claims`,
                      "Claims Count",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Claims Count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* A/R Aging Breakdown Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">A/R Aging Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed breakdown of claims by aging buckets with actionable
            insights
          </p>
        </CardHeader>
        <CardContent>
          {/* Enhanced Distribution Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-4">
              Distribution by Amount and Percentage
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  layout="vertical"
                  margin={{ left: 60, right: 12, top: 12, bottom: 12 }}
                >
                  <XAxis
                    type="number"
                    axisLine={true}
                    tickLine={false}
                    stroke="#6b7280"
                  />
                  <YAxis
                    dataKey="bucket"
                    type="category"
                    axisLine={true}
                    tickLine={false}
                    width={50}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Amount",
                    ]}
                  />
                  <Bar
                    dataKey="amount"
                    name="Amount"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bucket-wise Claims Lists */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Claims by Aging Bucket</h4>
            {Object.entries(rcmMetrics.agingBuckets).map(([bucket, amount]) => {
              if (amount === 0) return null;

              const count =
                rcmMetrics.agingCounts[
                  bucket as keyof typeof rcmMetrics.agingCounts
                ];
              const percentage =
                rcmMetrics.totalOutstandingAR > 0
                  ? (amount / rcmMetrics.totalOutstandingAR) * 100
                  : 0;
              const isOpen = openSections[bucket] ?? bucket === "90+"; // Default expand critical bucket

              const toggleSection = () => {
                setOpenSections((prev) => ({
                  ...prev,
                  [bucket]: !isOpen,
                }));
              };

              // Filter claims for this bucket
              const bucketClaims = outstandingClaims
                .map((claim) => ({
                  ...claim,
                  daysOutstanding: daysBetween(claim.dos, new Date()),
                }))
                .filter((claim) => {
                  const days = claim.daysOutstanding;
                  if (bucket === "0-30") return days <= 30;
                  if (bucket === "31-60") return days > 30 && days <= 60;
                  if (bucket === "61-90") return days > 60 && days <= 90;
                  if (bucket === "90+") return days > 90;
                  return false;
                })
                .sort((a, b) => b.total_amount - a.total_amount) // Sort by amount descending
                .slice(0, 10); // Show top 10 by amount

              const bucketColor =
                bucket === "0-30"
                  ? "text-green-600"
                  : bucket === "31-60"
                  ? "text-amber-600"
                  : bucket === "61-90"
                  ? "text-orange-600"
                  : "text-red-600";

              const bucketBg =
                bucket === "0-30"
                  ? "bg-green-50 border-green-200"
                  : bucket === "31-60"
                  ? "bg-amber-50 border-amber-200"
                  : bucket === "61-90"
                  ? "bg-orange-50 border-orange-200"
                  : "bg-red-50 border-red-200";

              return (
                <Collapsible
                  key={bucket}
                  open={isOpen}
                  onOpenChange={toggleSection}
                >
                  <CollapsibleTrigger
                    className={`w-full p-4 rounded-lg border transition-colors hover:bg-muted/50 ${bucketBg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                        <div className="text-left">
                          <div className={`font-medium ${bucketColor}`}>
                            {bucket} Days ({count} claims)
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(amount)} ({percentage.toFixed(1)}%
                            of total A/R)
                          </div>
                        </div>
                      </div>
                      {bucket === "90+" && amount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    {bucketClaims.length > 0 ? (
                      <div className="space-y-2">
                        {bucketClaims.map((claim) => {
                          const claimUrl = teamSlug
                            ? `/team/${teamSlug}/claims?claim=${claim.id}`
                            : `/claims?claim=${claim.id}`;

                          return (
                            <Link key={claim.id} href={claimUrl}>
                              <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-sm">
                                    {claim.id.replace("CLM-", "")}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {claim.payer.name}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-sm">
                                    {formatCurrency(claim.total_amount)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {claim.daysOutstanding} days old
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                        {count > 10 && (
                          <div className="text-xs text-muted-foreground text-center p-2">
                            ... and {count - 10} more claims
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center p-4">
                        No claims in this aging bucket
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Longest Outstanding Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Longest Outstanding Claims</CardTitle>
          <p className="text-sm text-muted-foreground">
            Claims requiring immediate attention (top 10 by days outstanding)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Claim
                  </th>
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Payer
                  </th>
                  <th className="text-right p-2 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-right p-2 font-medium text-muted-foreground">
                    Days Outstanding
                  </th>
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {longestClaims.map((claim) => {
                  const claimUrl = teamSlug
                    ? `/team/${teamSlug}/claims?claim=${claim.id}`
                    : `/claims?claim=${claim.id}`;

                  return (
                    <tr
                      key={claim.id}
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="p-2 font-mono text-sm">
                        <Link
                          href={claimUrl}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {claim.id.replace("CLM-", "")}
                        </Link>
                      </td>
                      <td className="p-2">{claim.payer.name}</td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(claim.total_amount)}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={
                              claim.daysOutstanding > 90
                                ? "font-semibold text-red-600"
                                : claim.daysOutstanding > 60
                                ? "font-semibold text-amber-600"
                                : ""
                            }
                          >
                            {claim.daysOutstanding}
                          </span>
                          {claim.daysOutstanding > 90 && (
                            <Badge variant="destructive" className="text-xs">
                              Critical
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {claim.status.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
