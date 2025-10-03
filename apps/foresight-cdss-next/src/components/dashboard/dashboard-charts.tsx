'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardChartsProps {
  className?: string;
}

const volumeData = [
  { month: 'May', volume: 55 },
  { month: 'Jun', volume: 78 },
  { month: 'Jul', volume: 96 },
  { month: 'Aug', volume: 120 },
  { month: 'Sep', volume: 148 },
];

const denialData = [
  { name: 'No Auth (197)', value: 48, color: '#ef4444' },
  { name: 'POS/Mod', value: 27, color: '#f59e0b' },
  { name: 'Eligibility', value: 17, color: '#10b981' },
  { name: 'Other', value: 8, color: '#6b7280' },
];

export function DashboardCharts({ className = '' }: DashboardChartsProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      <Card className="bg-white p-6 border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">ePA Volume (last 5 months)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Bar
                dataKey="volume"
                fill="#4f46e5"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-white p-6 border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Top Denial Reasons</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={denialData}
                cx="50%"
                cy="45%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {denialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
