'use client';

import { MetricCard } from '@/components/dashboard/metric-card';
import { StatusDistribution } from '@/components/dashboard/status-distribution';
import { ActionableQueues, getDefaultQueueData } from '@/components/dashboard/actionable-queues';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { AuditTrail } from '@/components/dashboard/audit-trail';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useDashboardMetrics, useStatusDistribution, useRecentActivity } from '@/hooks/use-dashboard-data';

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: statusDistribution, isLoading: statusLoading } = useStatusDistribution();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();

  if (metricsLoading || statusLoading || activityLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="space-y-6">
          {/* Alert skeleton */}
          <Skeleton className="h-12 w-full" />

          {/* Core metrics skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Automation metrics skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status distribution skeleton */}
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-12 w-12 mx-auto" />
                      <Skeleton className="h-3 w-16 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity skeleton */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Foresight Overview</h1>
        <p className="text-muted-foreground mt-1">Automated RCM System — Multi-state operations. Focus: Prior Authorization, E/M optimization, high automation rate.</p>
      </header>

      {/* Core KPI Metrics */}
      {metrics?.coreMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {metrics.coreMetrics.map((metric) => (
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
      {statusDistribution && (
        <div className="mb-8">
          <StatusDistribution distribution={statusDistribution} />
        </div>
      )}

      {/* Recent Activity */}
      <Card className="bg-card border shadow-sm mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent PA Activity</CardTitle>
            <Link href="/queue">
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:underline">
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
                {recentActivity?.map((activity) => (
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
                        <p className="font-medium text-foreground">{activity.patientName}</p>
                        <p className="text-xs text-muted-foreground">{activity.patientId}</p>
                        <p className="text-xs text-green-600 font-medium">{activity.conditions}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{activity.attempt}</p>
                        <p className="text-xs text-muted-foreground">{activity.medication}</p>
                      </div>
                    </td>
                    <td className="text-foreground">{activity.payer}</td>
                    <td>
                      <Badge variant={activity.status === 'auto-approved' ? 'secondary' : 'default'}>
                        {activity.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-1.5 rounded-full"
                            style={{ width: `${activity.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {activity.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{activity.updatedAt}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
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
