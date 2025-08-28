'use client';

import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Users, Clock, Target, BarChart3 } from 'lucide-react';
import { useDashboardMetrics, useStatusDistribution } from '@/hooks/use-dashboard-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(timeRanges[1]); // 30 days default
  
  const { data: metrics } = useDashboardMetrics();
  const { data: distribution } = useStatusDistribution();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Performance insights and trends for PA automation
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={selectedTimeRange.value === range.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total PAs Processed</p>
              <p className="text-3xl font-bold text-gray-900">1,247</p>
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
              <p className="text-sm font-medium text-gray-600">Automation Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">87%</p>
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
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <p className="text-3xl font-bold text-gray-900">2.1h</p>
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
              <p className="text-sm font-medium text-gray-600">Patients Served</p>
              <p className="text-3xl font-bold text-gray-900">892</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Time Trends</h3>
          <div className="space-y-4">
            {processingTimeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.period}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(item.avgTime / item.target) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.avgTime}h</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Target: {item.target}h
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Automation vs Manual Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Trends</h3>
          <div className="space-y-4">
            {automationTrends.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.month}</span>
                  <span className="text-gray-900">{item.automation}% automated</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payer Performance Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Payer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Approval Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Avg Processing Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Volume</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payerPerformance.map((payer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">{payer.payer}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">{payer.approvalRate}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
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
                  <td className="py-4 px-4 text-gray-600">{payer.avgTime}</td>
                  <td className="py-4 px-4 text-gray-600">{payer.volume} PAs</td>
                  <td className="py-4 px-4">
                    <Badge 
                      variant="secondary"
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

      {/* Status Distribution Visualization */}
      {distribution && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{distribution.needsReview}</div>
              <p className="text-sm text-gray-600">Needs Review</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{distribution.autoProcessing}</div>
              <p className="text-sm text-gray-600">Auto Processing</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{distribution.autoApproved}</div>
              <p className="text-sm text-gray-600">Auto Approved</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{distribution.denied}</div>
              <p className="text-sm text-gray-600">Denied</p>
            </div>
          </div>
          
          {/* Status distribution bar */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
              <div 
                className="bg-yellow-500" 
                style={{ width: `${(distribution.needsReview / distribution.total) * 100}%` }}
              ></div>
              <div 
                className="bg-blue-500" 
                style={{ width: `${(distribution.autoProcessing / distribution.total) * 100}%` }}
              ></div>
              <div 
                className="bg-green-500" 
                style={{ width: `${(distribution.autoApproved / distribution.total) * 100}%` }}
              ></div>
              <div 
                className="bg-red-500" 
                style={{ width: `${(distribution.denied / distribution.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Total: {distribution.total} PAs</p>
          </div>
        </Card>
      )}
    </div>
  );
}