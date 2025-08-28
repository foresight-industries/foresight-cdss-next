'use client';

import { MetricCard } from '@/components/dashboard/metric-card';
import { StatusDistribution } from '@/components/dashboard/status-distribution';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDashboardMetrics, useStatusDistribution, useRecentActivity } from '@/hooks/use-dashboard-data';

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: statusDistribution, isLoading: statusLoading } = useStatusDistribution();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();

  if (metricsLoading || statusLoading || activityLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* System Alert */}
      <Alert variant="success">
        <strong>System Status:</strong> All automations operational. CMM API responding in 340ms average.
      </Alert>

      {/* Core Metrics */}
      {metrics?.coreMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {metrics.coreMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      )}

      {/* Automation Performance */}
      {metrics?.automationMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {metrics.automationMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      )}

      {/* Status Distribution */}
      {statusDistribution && (
        <div className="mb-8">
          <StatusDistribution distribution={statusDistribution} />
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent PA Activity</CardTitle>
          <Link href="/queue">
            <Button variant="ghost" size="sm">
              View All →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Case ID
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    PA Attempt
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Payer
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    AI Confidence
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivity?.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <Link 
                        href={`/pa/${activity.id}`}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        {activity.id}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{activity.patientName}</p>
                        <p className="text-xs text-gray-500">{activity.patientId}</p>
                        <p className="text-xs text-green-600 font-medium">{activity.conditions}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{activity.attempt}</p>
                        <p className="text-xs text-gray-500">{activity.medication}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {activity.payer}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={activity.status}>
                        {activity.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-1.5 rounded-full"
                            style={{ width: `${activity.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {activity.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {activity.updatedAt}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No recent activity found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
