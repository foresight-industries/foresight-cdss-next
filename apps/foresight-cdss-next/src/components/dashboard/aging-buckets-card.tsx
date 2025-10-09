import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import type { AgingBuckets } from '@/utils/dashboard';

interface AgingBucketsCardProps {
  buckets: AgingBuckets;
  totalOutstandingAR: number;
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

export function AgingBucketsCard({ buckets, totalOutstandingAR }: AgingBucketsCardProps) {
  // Transform buckets data for chart
  const chartData = [
    { range: '0-30', amount: buckets['0-30'], label: '0-30 days' },
    { range: '31-60', amount: buckets['31-60'], label: '31-60 days' },
    { range: '61-90', amount: buckets['61-90'], label: '61-90 days' },
    { range: '90+', amount: buckets['90+'], label: '90+ days' },
  ];

  // Chart configuration
  const chartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className="p-6 transition-all duration-150 ease-in-out hover:translate-y-[-2px] hover:shadow-lg bg-card border shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          A/R Aging Buckets
        </h3>
        <span className="text-xs text-muted-foreground">
          Total: {formatCurrency(totalOutstandingAR)}
        </span>
      </div>
      
      {totalOutstandingAR === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No outstanding A/R</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Chart */}
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
                    className="w-[150px]"
                    nameKey="amount"
                    formatter={(value) => [formatCurrency(value as number), "  Amount"]}
                  />
                }
              />
              <Bar
                dataKey="amount"
                fill="var(--color-amount)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          
          {/* Legend with values */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            {chartData.map(({ range, amount, label }) => (
              <div key={range} className="flex justify-between">
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}