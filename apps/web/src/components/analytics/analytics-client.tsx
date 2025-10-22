'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Calendar, TrendingUp, TrendingDown, Users, Clock, Target, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStatusDistribution } from '@/hooks/use-dashboard-data';
import { initialClaims } from '@/data/claims';
import type { AnalyticsData } from '@/lib/analytics-data';

// Lazy load heavy components
const RCMStageAnalytics = lazy(() => import('@/components/analytics/rcm-stage-analytics').then(module => ({ default: module.RCMStageAnalytics })));
const ARAnalytics = lazy(() => import('@/components/analytics/ar-analytics').then(module => ({ default: module.ARAnalytics })));
const AnalyticsOverview = lazy(() => import('@/components/dashboard/dashboard-charts').then(module => ({ default: module.AnalyticsOverview })));

// Loading fallback for charts
function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  );
}

interface AnalyticsClientProps {
  data: AnalyticsData;
}

// Mock data for charts - keep these in client component as they're not heavy to compute
const processingTimeData = [
  { period: 'Week 1', avgTime: 4.2, target: 6 },
  { period: 'Week 2', avgTime: 3.8, target: 6 },
  { period: 'Week 3', avgTime: 2.1, target: 6 },
  { period: 'Week 4', avgTime: 1.9, target: 6 },
];

const combinedAutomationTrends = [
  {
    month: 'Oct',
    claimsAutomation: 72,
    pasAutomation: 78,
    combinedAutomation: 75,
    claimsQuality: 88,
    pasQuality: 91,
    combinedQuality: 89
  },
  {
    month: 'Nov',
    claimsAutomation: 79,
    pasAutomation: 85,
    combinedAutomation: 82,
    claimsQuality: 90,
    pasQuality: 93,
    combinedQuality: 91
  },
  {
    month: 'Dec',
    claimsAutomation: 84,
    pasAutomation: 90,
    combinedAutomation: 87,
    claimsQuality: 92,
    pasQuality: 94,
    combinedQuality: 93
  },
  {
    month: 'Jan',
    claimsAutomation: 89,
    pasAutomation: 93,
    combinedAutomation: 91,
    claimsQuality: 94,
    pasQuality: 96,
    combinedQuality: 95
  },
];

export function AnalyticsClient({ data }: Readonly<AnalyticsClientProps>) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState<"all" | "claims" | "pas">("all");
  const { data: distribution } = useStatusDistribution();

  const {
    stageMetrics,
    rcmMetrics,
    combinedKPIData,
    combinedPayerData,
    realStatusDistribution,
  } = data;

  // Handle anchor navigation for A/R details
  useEffect(() => {
    if (
      typeof globalThis !== "undefined" &&
      globalThis.location.hash === "#ar-details"
    ) {
      const element = document.getElementById("ar-details");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Performance insights and trends for PA automation and RCM analytics
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center justify-between">
        {/* Sub-tabs */}
        <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className="text-sm h-8"
          >
            All
          </Button>
          <Button
            variant={activeTab === "claims" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("claims")}
            className="text-sm h-8"
          >
            Claims
          </Button>
          <Button
            variant={activeTab === "pas" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("pas")}
            className="text-sm h-8"
          >
            PAs
          </Button>
        </div>

        {/* Time period selectors */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={selectedTimeRange === "7d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTimeRange("7d")}
              className="text-sm h-8"
            >
              7 days
            </Button>
            <Button
              variant={selectedTimeRange === "30d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTimeRange("30d")}
              className="text-sm h-8"
            >
              30 days
            </Button>
            <Button
              variant={selectedTimeRange === "90d" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTimeRange("90d")}
              className="text-sm h-8"
            >
              90 days
            </Button>
            <Button
              variant={selectedTimeRange === "1y" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedTimeRange("1y")}
              className="text-sm h-8"
            >
              1 year
            </Button>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      {activeTab === "all" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Combined Data - Total Items Processed */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Items Processed
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {combinedKPIData.totalItems.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +15% vs last month
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Claims: {combinedKPIData.totalClaims} • PAs:{" "}
                  {combinedKPIData.totalPAs}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Combined Data - Overall Automation Rate */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Automation Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {combinedKPIData.overallAutomationRate}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +7% vs last month
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Weighted average across all items
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Combined Data - Avg Processing Time */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Processing Time
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {combinedKPIData.avgProcessingTime.toFixed(1)}h
                </p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    -18min vs last month
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Weighted average processing time
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          {/* Combined Data - Patients Served */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Patients Served
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {combinedKPIData.patientsServed.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +11% vs last month
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Unique patients across all items
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      ) : activeTab === "claims" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Claims-specific KPIs */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Claims Processed
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {combinedKPIData.totalClaims.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +12% vs last month
                  </span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Claims Automation Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  85%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +4% vs last month
                  </span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Claims Processing
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  2.5h
                </p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    -22min vs last month
                  </span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Claims Success Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  92%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +3% vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* PAs-specific KPIs */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total PAs Processed
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {combinedKPIData.totalPAs.toLocaleString()}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +18% vs last month
                  </span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  PA Automation Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  89%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +9% vs last month
                  </span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg PA Processing
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  1.8h
                </p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    -15min vs last month
                  </span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  PA Approval Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  87%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">
                    +5% vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Processing Time Trends */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Processing Time Trends
        </h3>
        <div className="space-y-4">
          {processingTimeData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.period}
              </span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(item.avgTime / item.target) * 100}%`,
                      }}
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

      {/* Automation & Quality Over Time - Combined */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Automation & Quality Over Time -{" "}
            {activeTab === "all"
              ? "Combined"
              : activeTab === "claims"
              ? "Claims"
              : "PAs"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeTab === "all"
              ? "Weighted combination of automation rates and quality scores from both Claims and PAs"
              : activeTab === "claims"
              ? "Claims automation and quality trends over time"
              : "Prior Authorization automation and quality trends over time"}
          </p>
        </div>
        <div className="space-y-4">
          {combinedAutomationTrends.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.month}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-900 dark:text-gray-100">
                    {activeTab === "all"
                      ? item.combinedAutomation
                      : activeTab === "claims"
                      ? item.claimsAutomation
                      : item.pasAutomation}
                    % automated
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400">
                    {activeTab === "all"
                      ? item.combinedQuality
                      : activeTab === "claims"
                      ? item.claimsQuality
                      : item.pasQuality}
                    % quality
                  </span>
                </div>
              </div>

              {/* Automation Rate Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Automation Rate</span>
                  <span className="text-gray-500">
                    {activeTab === "all"
                      ? item.combinedAutomation
                      : activeTab === "claims"
                      ? item.claimsAutomation
                      : item.pasAutomation}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          activeTab === "all"
                            ? item.combinedAutomation
                            : activeTab === "claims"
                            ? item.claimsAutomation
                            : item.pasAutomation
                        )
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Quality Score Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Quality Score</span>
                  <span className="text-gray-500">
                    {activeTab === "all"
                      ? item.combinedQuality
                      : activeTab === "claims"
                      ? item.claimsQuality
                      : item.pasQuality}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${
                        activeTab === "all"
                          ? item.combinedQuality
                          : activeTab === "claims"
                          ? item.claimsQuality
                          : item.pasQuality
                      }%`,
                      backgroundColor: "#06b6d4",
                    }}
                  ></div>
                </div>
              </div>

              {/* Breakdown for "All" tab */}
              {activeTab === "all" && (
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div>
                    Claims: {item.claimsAutomation}% automation,{" "}
                    {item.claimsQuality}% quality
                  </div>
                  <div>
                    PAs: {item.pasAutomation}% automation, {item.pasQuality}%
                    quality
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Payer Performance Analysis */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Payer Performance Analysis -{" "}
            {activeTab === "all"
              ? "Combined View"
              : activeTab === "claims"
              ? "Claims Only"
              : "PAs Only"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeTab === "all"
              ? "Performance metrics across both Claims and Prior Authorizations"
              : activeTab === "claims"
              ? "Claims performance metrics across all payers"
              : "Prior Authorization performance metrics across all payers"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                  Payer
                </th>
                {activeTab === "all" && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Claims Acceptance
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      PA Approval
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Avg Claims Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Avg PA Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Claims Vol
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      PA Vol
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Overall Performance
                    </th>
                  </>
                )}
                {activeTab === "claims" && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Claims Acceptance Rate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Avg Processing Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Volume
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Performance
                    </th>
                  </>
                )}
                {activeTab === "pas" && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      PA Approval Rate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Avg Processing Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Volume
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Performance
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {combinedPayerData
                .filter((payer) => {
                  if (activeTab === "claims") {
                    return payer.claimsVolume > 0;
                  } else if (activeTab === "pas") {
                    return payer.paVolume > 0;
                  }
                  return true;
                })
                .map((payer, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">
                      {payer.payerName}
                    </td>

                    {activeTab === "all" && (
                      <>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-gray-100">
                              {payer.claimsAcceptanceRate}%
                            </span>
                            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  payer.claimsAcceptanceRate >= 85
                                    ? "bg-green-500"
                                    : payer.claimsAcceptanceRate >= 75
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${payer.claimsAcceptanceRate}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-gray-100">
                              {payer.paApprovalRate}%
                            </span>
                            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  payer.paApprovalRate >= 85
                                    ? "bg-green-500"
                                    : payer.paApprovalRate >= 75
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${payer.paApprovalRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {payer.avgClaimsProcessing}h
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {payer.avgPAProcessing}h
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {payer.claimsVolume}
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {payer.paVolume}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">
                              {payer.overallPerformance}%
                            </span>
                            <Badge
                              variant="default"
                              className={
                                payer.overallPerformance >= 85
                                  ? "bg-green-100 text-green-800"
                                  : payer.overallPerformance >= 75
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {payer.overallPerformance >= 85
                                ? "Excellent"
                                : payer.overallPerformance >= 75
                                ? "Good"
                                : "Needs Attention"}
                            </Badge>
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "claims" && (
                      <>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-gray-100">
                              {payer.claimsAcceptanceRate}%
                            </span>
                            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  payer.claimsAcceptanceRate >= 85
                                    ? "bg-green-500"
                                    : payer.claimsAcceptanceRate >= 75
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${payer.claimsAcceptanceRate}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {payer.avgClaimsProcessing}h
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {payer.claimsVolume}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">
                              {payer.claimsAcceptanceRate}%
                            </span>
                            <Badge
                              variant="default"
                              className={
                                payer.claimsAcceptanceRate >= 85
                                  ? "bg-green-100 text-green-800"
                                  : payer.claimsAcceptanceRate >= 75
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {payer.claimsAcceptanceRate >= 85
                                ? "Excellent"
                                : payer.claimsAcceptanceRate >= 75
                                ? "Good"
                                : "Needs Attention"}
                            </Badge>
                          </div>
                        </td>
                      </>
                    )}

                    {activeTab === "pas" && (
                      <>
                        <td className="py-4 px-4">
                          {payer.paVolume > 0 ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-900 dark:text-gray-100">
                                {payer.paApprovalRate}%
                              </span>
                              <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    payer.paApprovalRate >= 85
                                      ? "bg-green-500"
                                      : payer.paApprovalRate >= 75
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${payer.paApprovalRate}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No PAs
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {payer.paVolume > 0
                            ? `${payer.avgPAProcessing}h`
                            : "—"}
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          {payer.paVolume}
                        </td>
                        <td className="py-4 px-4">
                          {payer.paVolume > 0 ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                {payer.paApprovalRate}%
                              </span>
                              <Badge
                                variant="default"
                                className={
                                  payer.paApprovalRate >= 85
                                    ? "bg-green-100 text-green-800"
                                    : payer.paApprovalRate >= 75
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {payer.paApprovalRate >= 85
                                  ? "Excellent"
                                  : payer.paApprovalRate >= 75
                                  ? "Good"
                                  : "Needs Attention"}
                              </Badge>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-gray-300 bg-gray-50 text-gray-500"
                            >
                              No Data
                            </Badge>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Denial Management & Analytics Section - Lazy loaded */}
      {distribution && (
        <Suspense fallback={<ChartSkeleton />}>
          <AnalyticsOverview
            statusDistribution={distribution}
            claimItems={initialClaims}
            activeTab={activeTab}
          />
        </Suspense>
      )}

      {/* Claims-specific sections - only show when Claims tab is selected */}
      {activeTab === "claims" && (
        <>
          {/* RCM Stage Analytics Section - Lazy loaded */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <Suspense fallback={<ChartSkeleton />}>
              <RCMStageAnalytics stageMetrics={stageMetrics} />
            </Suspense>
          </div>

          {/* A/R Details Section - Lazy loaded */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <Suspense fallback={<ChartSkeleton />}>
              <ARAnalytics claims={initialClaims} rcmMetrics={rcmMetrics} />
            </Suspense>
          </div>
        </>
      )}

      {/* Combined Status Distribution Visualization */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Current Status Distribution
          </h3>

          {/* Claims Status Distribution */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-foreground">
                Claims Status
              </h4>
              <span className="text-sm text-muted-foreground">
                Total: {realStatusDistribution.claims.total} Claims
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: "needs_review",
                  label: "Needs Review",
                  color: "bg-yellow-500",
                  count: realStatusDistribution.claims.needs_review,
                },
                {
                  key: "built",
                  label: "Built",
                  color: "bg-blue-500",
                  count: realStatusDistribution.claims.built,
                },
                {
                  key: "submitted",
                  label: "Submitted",
                  color: "bg-indigo-500",
                  count: realStatusDistribution.claims.submitted,
                },
                {
                  key: "awaiting_277ca",
                  label: "Awaiting 277CA",
                  color: "bg-purple-500",
                  count: realStatusDistribution.claims.awaiting_277ca,
                },
                {
                  key: "accepted_277ca",
                  label: "Accepted",
                  color: "bg-green-500",
                  count: realStatusDistribution.claims.accepted_277ca,
                },
                {
                  key: "rejected_277ca",
                  label: "Rejected",
                  color: "bg-red-500",
                  count: realStatusDistribution.claims.rejected_277ca,
                },
                {
                  key: "paid",
                  label: "Paid",
                  color: "bg-emerald-500",
                  count: realStatusDistribution.claims.paid,
                },
                {
                  key: "denied",
                  label: "Denied",
                  color: "bg-rose-600",
                  count: realStatusDistribution.claims.denied,
                },
              ]
                .filter((item) => item.count > 0)
                .map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{
                            width: `${
                              (item.count /
                                realStatusDistribution.claims.total) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-foreground w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* PA Status Distribution */}
          {realStatusDistribution.pas.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-foreground">
                  Prior Authorization Status
                </h4>
                <span className="text-sm text-muted-foreground">
                  Total: {realStatusDistribution.pas.total} PAs
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: "needsReview",
                    label: "Needs Review",
                    color: "bg-yellow-500",
                    count: realStatusDistribution.pas.needsReview,
                  },
                  {
                    key: "autoProcessing",
                    label: "Auto Processing",
                    color: "bg-blue-500",
                    count: realStatusDistribution.pas.autoProcessing,
                  },
                  {
                    key: "autoApproved",
                    label: "Auto Approved",
                    color: "bg-green-500",
                    count: realStatusDistribution.pas.autoApproved,
                  },
                  {
                    key: "autoDenied",
                    label: "Auto Denied",
                    color: "bg-orange-600",
                    count: realStatusDistribution.pas.autoDenied,
                  },
                  {
                    key: "denied",
                    label: "Denied",
                    color: "bg-red-500",
                    count: realStatusDistribution.pas.denied,
                  },
                  {
                    key: "error",
                    label: "Error",
                    color: "bg-pink-600",
                    count: realStatusDistribution.pas.error,
                  },
                ]
                  .filter((item) => item.count > 0)
                  .map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{
                              width: `${
                                (item.count /
                                  realStatusDistribution.pas.total) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-foreground w-8 text-right">
                          {item.count}
                        </span>
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
