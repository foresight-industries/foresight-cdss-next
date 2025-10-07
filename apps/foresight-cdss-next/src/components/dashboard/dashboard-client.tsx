'use client';

import { MetricCard } from '@/components/dashboard/metric-card';
import { StatusDistribution } from '@/components/dashboard/status-distribution';
import { ActionableQueues, getDefaultQueueData } from '@/components/dashboard/actionable-queues';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { AuditTrail } from '@/components/dashboard/audit-trail';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { StatusDistribution as StatusDistributionType } from '@/types/pa.types';

interface DashboardClientProps {
  initialMetrics: any;
  initialStatusDistribution: StatusDistributionType | null;
  initialRecentActivity: any[];
}

export default function DashboardClient({
  initialMetrics,
  initialStatusDistribution,
  initialRecentActivity,
}: Readonly<DashboardClientProps>) {

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Foresight Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Automated RCM System — Multi-state operations. Focus: Prior
          Authorization, E/M optimization, high automation rate.
        </p>
      </header>

      {/* Core KPI Metrics */}
      {initialMetrics?.coreMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {initialMetrics.coreMetrics.map((metric: any) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      )}

      {/* Charts Section */}
      <DashboardCharts className="mb-8" />

      {/* Actionable Queues */}
      <div className="mb-8">
        <ActionableQueues queueData={getDefaultQueueData()} />
      </div>

      {/* Status Distribution */}
      {initialStatusDistribution && (
        <div className="mb-8">
          <StatusDistribution distribution={initialStatusDistribution} />
        </div>
      )}

      {/* Recent Activity */}
      <Card className="bg-card border shadow-xs mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Recent PA Activity
            </CardTitle>
            <Link href="/queue">
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-600 hover:underline"
              >
                View All →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Case ID</th>
                  <th>Patient</th>
                  <th>PA Attempt</th>
                  <th>Payer</th>
                  <th>Status</th>
                  <th>AI Confidence</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialRecentActivity?.map((activity) => (
                  <tr key={activity.id} className="hover:bg-accent/50">
                    <td className="py-2">
                      <Link
                        href={`/pa/${activity.id}`}
                        className="text-primary font-semibold hover:underline"
                      >
                        {activity.id}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">
                          {activity.patientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.patientId}
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          {activity.conditions}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {activity.attempt}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.medication}
                        </p>
                      </div>
                    </td>
                    <td className="text-foreground">{activity.payer}</td>
                    <td>
                      <Badge
                        variant={
                          activity.status === "auto-approved"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {activity.status
                          .replace("-", " ")
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-linear-to-r from-cyan-500 to-blue-600 h-1.5 rounded-full"
                            style={{ width: `${activity.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {activity.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">
                      {activity.updatedAt}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No recent activity found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <AuditTrail />
    </div>
  );
}
