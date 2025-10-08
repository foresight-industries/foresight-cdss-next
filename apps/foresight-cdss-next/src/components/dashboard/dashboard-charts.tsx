'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusDistribution } from '@/components/dashboard/status-distribution';
import type { StatusDistribution as StatusDistributionType } from '@/types/pa.types';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from 'recharts';
import { Bar, BarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface AnalyticsOverviewProps {
  statusDistribution: StatusDistributionType;
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

const chartConfig = {
  epa: {
    label: "ePA",
    color: "var(--chart-1)",
  },
  claims: {
    label: "Claims",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const automationChartConfig = {
  automation: {
    label: "Automation rate",
    color: "var(--chart-1)",
  },
  quality: {
    label: "Quality score",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function AnalyticsOverview({ statusDistribution, className = '' }: AnalyticsOverviewProps) {
  return (
    <Card className={`bg-card border shadow-xs ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <StatusDistribution distribution={statusDistribution} variant="inline" />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Volume Trends</CardTitle>
              <CardDescription>
                Stacked view of ePA and claim throughput over last 6 months.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[30%] lg:min-h-[15%]">
                <BarChart accessibilityLayer data={volumeTrend}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <Bar
                    dataKey="epa"
                    stackId="a"
                    fill="var(--chart-1)"
                    radius={[0, 0, 4, 4]}
                  />
                  <Bar
                    dataKey="claims"
                    stackId="a"
                    fill="var(--chart-2)"
                    radius={[4, 4, 0, 0]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        className="w-[180px]"
                        formatter={(value, name, item, index) => (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                              style={
                                {
                                  "--color-bg": `var(--color-${name})`,
                                } as React.CSSProperties
                              }
                            />
                            {chartConfig[name as keyof typeof chartConfig]?.label ||
                              name}
                            <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                              {value}
                              <span className="text-muted-foreground font-normal">
                                items
                              </span>
                            </div>
                            {/* Add this after the last item */}
                            {index === 1 && (
                              <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                                Total
                                <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                                  {item.payload.epa + item.payload.claims}
                                  <span className="text-muted-foreground font-normal">
                                    items
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      />
                    }
                    cursor={false}
                    defaultIndex={1}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

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

        <Card className="max-h-[25%]">
          <CardHeader>
            <CardTitle>Automation & Quality Over Time</CardTitle>
            <CardDescription>
              Rolling averages for automation rate and documentation quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={automationChartConfig} className="min-h-[15%]">
              <LineChart
                accessibilityLayer
                data={automationQuality}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                  domain={[70, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickCount={4}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend
                  wrapperStyle={{
                    fontSize: '14px',
                    marginTop: 8
                  }}
                />
                <Line
                  dataKey="automation"
                  name="Automation rate"
                  type="monotone"
                  stroke="var(--color-automation)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="quality"
                  name="Quality score"
                  type="monotone"
                  stroke="var(--color-quality)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
