'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Users, Clock, Target, BarChart3 } from 'lucide-react';
import {
  // useDashboardMetrics,
  useStatusDistribution
} from '@/hooks/use-dashboard-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RCMStageAnalytics } from '@/components/analytics/rcm-stage-analytics';
import { AnalyticsOverview } from '@/components/dashboard/dashboard-charts';
import { ARAnalytics } from '@/components/analytics/ar-analytics';
import { computeStageAnalytics } from '@/utils/stage-analytics';
import { calculateRCMMetrics } from '@/utils/dashboard';
import { initialClaims } from '@/data/claims';

interface TimeRange {
  label: string;
  value: '7d' | '30d' | '90d' | '1y';
}

const timeRanges: TimeRange[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year', value: '1y' },
];

// Mock data for charts - in real implementation, these would come from API
const processingTimeData = [
  { period: 'Week 1', avgTime: 4.2, target: 6.0 },
  { period: 'Week 2', avgTime: 3.8, target: 6.0 },
  { period: 'Week 3', avgTime: 2.1, target: 6.0 },
  { period: 'Week 4', avgTime: 1.9, target: 6.0 },
];

const automationTrends = [
  { month: 'Oct', automation: 75, manual: 25 },
  { month: 'Nov', automation: 82, manual: 18 },
  { month: 'Dec', automation: 87, manual: 13 },
  { month: 'Jan', automation: 91, manual: 9 },
];

const payerPerformance = [
  { payer: 'Aetna', approvalRate: 89, avgTime: '2.1h', volume: 245 },
  { payer: 'UnitedHealth', approvalRate: 85, avgTime: '2.8h', volume: 198 },
  { payer: 'Cigna', approvalRate: 92, avgTime: '1.9h', volume: 167 },
  { payer: 'Anthem', approvalRate: 78, avgTime: '3.2h', volume: 134 },
];

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d'); // 30 days default

  // const { data: metrics } = useDashboardMetrics();
  const { data: distribution } = useStatusDistribution();

  // Compute stage analytics from claims data
  const stageMetrics = useMemo(() => {
    return computeStageAnalytics(initialClaims);
  }, []);

  // Compute RCM metrics from claims data
  const rcmMetrics = useMemo(() => {
    return calculateRCMMetrics(initialClaims);
  }, []);

  // Compute real status distribution from claims data
  const realStatusDistribution = useMemo(() => {
    // Claims status distribution
    const claimStatuses = initialClaims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // PA status distribution (only for claims that have pa_status)
    const paStatuses = initialClaims
      .filter(claim => claim.pa_status)
      .reduce((acc, claim) => {
        acc[claim.pa_status!] = (acc[claim.pa_status!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      claims: {
        needs_review: claimStatuses.needs_review || 0,
        built: claimStatuses.built || 0,
        submitted: claimStatuses.submitted || 0,
        awaiting_277ca: claimStatuses.awaiting_277ca || 0,
        accepted_277ca: claimStatuses.accepted_277ca || 0,
        rejected_277ca: claimStatuses.rejected_277ca || 0,
        paid: claimStatuses.paid || 0,
        denied: claimStatuses.denied || 0,
        total: initialClaims.length
      },
      pas: {
        needsReview: paStatuses['needs-review'] || 0,
        autoProcessing: paStatuses['auto-processing'] || 0,
        autoApproved: paStatuses['auto-approved'] || 0,
        autoDenied: paStatuses['auto-denied'] || 0,
        denied: paStatuses.denied || 0,
        error: paStatuses.error || 0,
        total: initialClaims.filter(claim => claim.pa_status).length
      }
    };
  }, []);

  // Handle anchor navigation for A/R details
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#ar-details') {
      const element = document.getElementById('ar-details');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Performance insights and trends for PA automation and RCM analytics
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <Tabs value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <TabsList>
              {timeRanges.map((range) => (
                <TabsTrigger key={range.value} value={range.value}>
                  {range.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total PAs Processed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">1,247</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12% vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Automation Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">87%</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+5% vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Processing Time</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">2.1h</p>
              <div className="flex items-center mt-2">
                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">-22min vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Patients Served</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">892</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8% vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Time Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Processing Time Trends</h3>
          <div className="space-y-4">
            {processingTimeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.period}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.avgTime / item.target) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.avgTime}h</span>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Target: {item.target}h
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Automation vs Manual Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Automation Trends</h3>
          <div className="space-y-4">
            {automationTrends.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{item.month}</span>
                  <span className="text-gray-900 dark:text-gray-100">{item.automation}% automated</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full relative"
                    style={{ width: `${item.automation}%` }}
                  >
                    <div
                      className="bg-red-400 h-2 rounded-r-full absolute right-0"
                      style={{ width: `${(item.manual / item.automation) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Payer Performance Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Payer Performance Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Payer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Approval Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Avg Processing Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Volume</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payerPerformance.map((payer, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">{payer.payer}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-gray-100">{payer.approvalRate}%</span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            payer.approvalRate >= 90 ? 'bg-green-500' :
                            payer.approvalRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${payer.approvalRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.avgTime}</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.volume} PAs</td>
                  <td className="py-4 px-4">
                    <Badge
                      variant="default"
                      className={
                        payer.approvalRate >= 90 ? 'bg-green-100 text-green-800' :
                        payer.approvalRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {payer.approvalRate >= 90 ? 'Excellent' :
                       payer.approvalRate >= 80 ? 'Good' : 'Needs Attention'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Denial Management & Analytics Section */}
      {distribution && (
        <AnalyticsOverview statusDistribution={distribution} claimItems={initialClaims} />
      )}

      {/* RCM Stage Analytics Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <RCMStageAnalytics stageMetrics={stageMetrics} />
      </div>

      {/* A/R Details Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <ARAnalytics claims={initialClaims} rcmMetrics={rcmMetrics} />
      </div>

      {/* Combined Status Distribution Visualization */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Current Status Distribution</h3>

        {/* Claims Status Distribution */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-foreground">Claims Status</h4>
            <span className="text-sm text-muted-foreground">Total: {realStatusDistribution.claims.total} Claims</span>
          </div>

          <div className="space-y-3">
            {[
              { key: 'needs_review', label: 'Needs Review', color: 'bg-yellow-500', count: realStatusDistribution.claims.needs_review },
              { key: 'built', label: 'Built', color: 'bg-blue-500', count: realStatusDistribution.claims.built },
              { key: 'submitted', label: 'Submitted', color: 'bg-indigo-500', count: realStatusDistribution.claims.submitted },
              { key: 'awaiting_277ca', label: 'Awaiting 277CA', color: 'bg-purple-500', count: realStatusDistribution.claims.awaiting_277ca },
              { key: 'accepted_277ca', label: 'Accepted', color: 'bg-green-500', count: realStatusDistribution.claims.accepted_277ca },
              { key: 'rejected_277ca', label: 'Rejected', color: 'bg-red-500', count: realStatusDistribution.claims.rejected_277ca },
              { key: 'paid', label: 'Paid', color: 'bg-emerald-500', count: realStatusDistribution.claims.paid },
              { key: 'denied', label: 'Denied', color: 'bg-rose-600', count: realStatusDistribution.claims.denied }
            ].filter(item => item.count > 0).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${item.color}`}></div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${(item.count / realStatusDistribution.claims.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PA Status Distribution */}
        {realStatusDistribution.pas.total > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-foreground">Prior Authorization Status</h4>
              <span className="text-sm text-muted-foreground">Total: {realStatusDistribution.pas.total} PAs</span>
            </div>

            <div className="space-y-3">
              {[
                { key: 'needsReview', label: 'Needs Review', color: 'bg-yellow-500', count: realStatusDistribution.pas.needsReview },
                { key: 'autoProcessing', label: 'Auto Processing', color: 'bg-blue-500', count: realStatusDistribution.pas.autoProcessing },
                { key: 'autoApproved', label: 'Auto Approved', color: 'bg-green-500', count: realStatusDistribution.pas.autoApproved },
                { key: 'autoDenied', label: 'Auto Denied', color: 'bg-orange-600', count: realStatusDistribution.pas.autoDenied },
                { key: 'denied', label: 'Denied', color: 'bg-red-500', count: realStatusDistribution.pas.denied },
                { key: 'error', label: 'Error', color: 'bg-pink-600', count: realStatusDistribution.pas.error }
              ].filter(item => item.count > 0).map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${(item.count / realStatusDistribution.pas.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-foreground w-8 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </Card>
      </div>
    </div>
  );
}
