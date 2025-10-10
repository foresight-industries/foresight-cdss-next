'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { StageAnalytics } from '@/utils/stage-analytics';

interface RCMStageAnalyticsProps {
  stageMetrics: StageAnalytics;
}

const COLORS = {
  primary: '#6366f1', // Indigo-500
  accepted: '#22c55e', // Green-500
  rejected: '#ef4444', // Red-500
  paid: '#0ea5e9', // Sky-500
  denied: '#f97316', // Orange-500
};

export function RCMStageAnalytics({
  stageMetrics,
}: Readonly<RCMStageAnalyticsProps>) {
  // Prepare data for duration chart
  const durationData = [
    { stage: "Internal Processing", days: stageMetrics.avgBuildToSubmitDays },
    { stage: "Payer Response", days: stageMetrics.avgSubmitToOutcomeDays },
    { stage: "Payment Processing", days: stageMetrics.avgAcceptedToPaidDays },
  ].filter((item) => item.days > 0); // Only show stages with data

  // Prepare data for initial outcome pie chart
  const initialOutcomeData = [
    {
      name: "Accepted",
      value: Math.round(
        stageMetrics.submitToOutcomeBreakdown.acceptedRate * 100
      ),
      color: COLORS.accepted,
    },
    {
      name: "Rejected",
      value: Math.round(
        stageMetrics.submitToOutcomeBreakdown.rejectedRate * 100
      ),
      color: COLORS.rejected,
    },
    {
      name: "Denied",
      value: Math.round(stageMetrics.submitToOutcomeBreakdown.deniedRate * 100),
      color: COLORS.denied,
    },
  ].filter((item) => item.value > 0);

  // Prepare data for final outcome pie chart
  const finalSuccessRate = Math.round(stageMetrics.overallSuccessRate * 100);
  const finalOutcomeData = [
    {
      name: "Paid",
      value: finalSuccessRate,
      color: COLORS.paid,
    },
    {
      name: "Not Paid",
      value: 100 - finalSuccessRate,
      color: COLORS.rejected,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Claims Stage Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Performance of claims through billing stages
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stageMetrics.avgProcessingDays}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Avg Total Processing Days
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {finalSuccessRate}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overall Success Rate
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stageMetrics.totalClaims}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Claims Analyzed
            </p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Durations Bar Chart */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-4">
            Average Stage Durations
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={durationData}
                layout="vertical"
                margin={{ left: 20, right: 12, top: 12, bottom: 12 }}
                barCategoryGap="20%"
              >
                <XAxis
                  type="number"
                  dataKey="days"
                  axisLine={true}
                  tickLine={false}
                  stroke="#6b7280"
                />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={true}
                  width={120}
                  stroke="#6b7280"
                />
                <Tooltip
                  formatter={(value: number) => [`${value} days`, "Duration"]}
                />
                <Bar dataKey="days" fill="#8b5cf6" radius={5} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Initial Outcomes Pie Chart */}
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-4">
            Initial Submission Outcomes
          </h4>
          {initialOutcomeData.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={initialOutcomeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {initialOutcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    formatter={(value: number) => [`${value}%`, "Percentage"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              No outcome data available
            </div>
          )}
        </Card>
      </div>

      {/* Final Success Rate */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-4">Final Collection Rate</h4>
        {finalOutcomeData.length > 0 ? (
          <div className="flex items-center justify-center">
            <div className="h-[150px] w-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalOutcomeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {finalOutcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    formatter={(value: number) => [`${value}%`, "Percentage"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ml-8 space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-sky-500 rounded mr-2"></div>
                <span className="text-sm">Paid Claims</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span className="text-sm">Unpaid Claims</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[150px] flex items-center justify-center text-gray-500">
            No final outcome data available
          </div>
        )}
      </Card>
    </div>
  );
}
