import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bar, BarChart, XAxis, YAxis, Cell } from 'recharts';
import { ArrowRight } from 'lucide-react';
import type { AgingBuckets } from '@/utils/dashboard';

interface AgingBucketsCardProps {
  buckets: AgingBuckets;
  counts: AgingBuckets;
  totalOutstandingAR: number;
  tooltip?: string;
}

// Format currency values
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function AgingBucketsCard({ buckets, counts, totalOutstandingAR, tooltip }: AgingBucketsCardProps) {
  const params = useParams();
  const teamSlug = params?.slug as string;

  // Aging bucket colors for visual hierarchy
  const bucketColors = {
    '0-30': '#22c55e',   // Green - good
    '31-60': '#facc15',  // Amber - caution
    '61-90': '#f97316',  // Orange - warning
    '90+': '#ef4444'     // Red - critical
  };

  // Transform buckets data for chart with individual colors
  const chartData = [
    { 
      range: '0-30', 
      amount: buckets['0-30'], 
      count: counts['0-30'],
      label: '0-30 days',
      fill: bucketColors['0-30']
    },
    { 
      range: '31-60', 
      amount: buckets['31-60'], 
      count: counts['31-60'],
      label: '31-60 days',
      fill: bucketColors['31-60']
    },
    { 
      range: '61-90', 
      amount: buckets['61-90'], 
      count: counts['61-90'],
      label: '61-90 days',
      fill: bucketColors['61-90']
    },
    { 
      range: '90+', 
      amount: buckets['90+'], 
      count: counts['90+'],
      label: '90+ days',
      fill: bucketColors['90+']
    },
  ];

  // Calculate percentages and determine if warning conditions exist
  const criticalPercentage = totalOutstandingAR > 0 ? (buckets['90+'] / totalOutstandingAR) * 100 : 0;
  const isHighRisk = criticalPercentage > 20 || buckets['90+'] > 0;

  // Chart configuration for multi-colored bars
  const chartConfig = {
    '0-30': { label: "0-30 days", color: bucketColors['0-30'] },
    '31-60': { label: "31-60 days", color: bucketColors['31-60'] },
    '61-90': { label: "61-90 days", color: bucketColors['61-90'] },
    '90+': { label: "90+ days", color: bucketColors['90+'] },
  };

  const cardContent = (
    <Card className="p-6 transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg hover:border-primary/20 bg-card border border-border/60 shadow-xs cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            A/R Aging Buckets
          </h3>
          <ArrowRight className="w-3 h-3 text-muted-foreground opacity-60" />
        </div>
        <span className={`text-xs font-medium ${isHighRisk ? 'text-red-600' : 'text-muted-foreground'}`}>
          Total: {formatCurrency(totalOutstandingAR)}
        </span>
      </div>
      
      {totalOutstandingAR === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No outstanding A/R</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Multi-colored chart */}
          <ChartContainer config={chartConfig} className="h-[120px] w-full">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <XAxis
                dataKey="range"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    formatter={(value, name, props) => [
                      `${formatCurrency(value as number)} (${props.payload?.count} claims)`,
                      `${props.payload?.label}`
                    ]}
                  />
                }
              />
              <Bar
                dataKey="amount"
                radius={[2, 2, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          
          {/* Enhanced legend with amounts, counts, and percentages */}
          <div className="space-y-1.5">
            {chartData.filter(item => item.amount > 0).map(({ range, amount, count, label, fill }) => {
              const percentage = totalOutstandingAR > 0 ? (amount / totalOutstandingAR) * 100 : 0;
              return (
                <div key={range} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: fill }}
                    />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(amount)} ({count} claims)
                    </div>
                    <div className="text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Risk indicator for 90+ days */}
          {buckets['90+'] > 0 && (
            <div className="mt-3 p-2 rounded-md bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs font-medium text-red-700">
                  Critical: {formatCurrency(buckets['90+'])} in 90+ days
                  {criticalPercentage > 20 && ` (${criticalPercentage.toFixed(1)}% of total)`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );

  // Wrap in navigation link
  const navigationUrl = teamSlug 
    ? `/team/${teamSlug}/analytics#ar-details`
    : `/analytics#ar-details`;

  const wrappedContent = (
    <Link href={navigationUrl} className="block">
      {cardContent}
    </Link>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {wrappedContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return wrappedContent;
}