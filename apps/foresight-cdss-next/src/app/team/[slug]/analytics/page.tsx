'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Users, Clock, Target, BarChart3 } from 'lucide-react';
import {
  // useDashboardMetrics,
  useStatusDistribution
} from '@/hooks/use-dashboard-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RCMStageAnalytics } from '@/components/analytics/rcm-stage-analytics';
import { AnalyticsOverview } from '@/components/dashboard/dashboard-charts';
import { ARAnalytics } from '@/components/analytics/ar-analytics';
import { computeStageAnalytics } from '@/utils/stage-analytics';
import { calculateRCMMetrics } from '@/utils/dashboard';
import { initialClaims } from '@/data/claims';

// interface TimeRange {
//   label: string;
//   value: '7d' | '30d' | '90d' | '1y';
// }

// const timeRanges: TimeRange[] = [
//   { label: '7 days', value: '7d' },
//   { label: '30 days', value: '30d' },
//   { label: '90 days', value: '90d' },
//   { label: '1 year', value: '1y' },
// ];

// Mock data for charts - in real implementation, these would come from API
const processingTimeData = [
  { period: 'Week 1', avgTime: 4.2, target: 6.0 },
  { period: 'Week 2', avgTime: 3.8, target: 6.0 },
  { period: 'Week 3', avgTime: 2.1, target: 6.0 },
  { period: 'Week 4', avgTime: 1.9, target: 6.0 },
];

// Combined automation trends with quality scores
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

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d'); // 30 days default
  const [activeTab, setActiveTab] = useState<'all' | 'claims' | 'pas'>('all');

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

  // Compute combined payer performance data
  const combinedPayerData = useMemo(() => {
    // Group claims by payer
    const claimsByPayer = initialClaims.reduce((acc, claim) => {
      const payerName = claim.payer.name;
      if (!acc[payerName]) {
        acc[payerName] = {
          claims: [],
          pas: []
        };
      }
      acc[payerName].claims.push(claim);

      // If claim has PA status, also add it to PA data
      if (claim.pa_status) {
        acc[payerName].pas.push(claim);
      }

      return acc;
    }, {} as Record<string, { claims: typeof initialClaims, pas: typeof initialClaims }>);

    // Calculate metrics for each payer with realistic data
    return Object.entries(claimsByPayer).map(([payerName, data]) => {
      // Claims metrics - more inclusive success criteria
      const claimsVolume = data.claims.length;

      // Add payer-specific variance using EXACT payer names from demo data
      const payerPerformance: Record<string, { claimsRate: number; paRate: number }> = {
        'Cigna': { claimsRate: 94, paRate: 91 },                    // Top excellent performer
        'Kaiser Permanente': { claimsRate: 92, paRate: 89 },       // Excellent performer
        'Aetna': { claimsRate: 88, paRate: 86 },                   // Excellent performer
        'UnitedHealthcare': { claimsRate: 84, paRate: 87 },        // Excellent performer
        'Blue Cross Blue Shield': { claimsRate: 81, paRate: 83 },  // Good performer
        'MI Medicaid': { claimsRate: 79, paRate: 82 },             // Good performer
        'Sunshine (FL Medicaid)': { claimsRate: 77, paRate: 80 },  // Good performer
        'Superior (TX Medicaid)': { claimsRate: 89, paRate: 86 },  // Excellent performer (fixed)
        'Anthem BCBS': { claimsRate: 73, paRate: 75 },             // Needs attention
        'Anthem Blue Cross': { claimsRate: 69, paRate: 71 },       // Needs attention
        'Molina Healthcare': { claimsRate: 66, paRate: 68 },       // Poor performer
        'BCBSM': { claimsRate: 63, paRate: 65 }                    // Worst performer
      };

      const performance = payerPerformance[payerName] || { claimsRate: 75, paRate: 78 };
      const claimsAcceptanceRate = performance.claimsRate;

      // PA metrics - use predefined rates for more variation
      const paVolume = data.pas.length;
      const paApprovalRate = performance.paRate;

      // Realistic processing times using EXACT payer names
      const processingTimes: Record<string, { claims: number; pas: number }> = {
        'Cigna': { claims: 1.4, pas: 1.0 },                    // Fastest (best performer)
        'Kaiser Permanente': { claims: 1.5, pas: 1.1 },       // Very fast
        'Aetna': { claims: 1.8, pas: 1.3 },                   // Fast
        'UnitedHealthcare': { claims: 2.0, pas: 1.5 },        // Good
        'Blue Cross Blue Shield': { claims: 2.2, pas: 1.6 },  // Average
        'MI Medicaid': { claims: 2.4, pas: 1.8 },             // Slower (govt)
        'Sunshine (FL Medicaid)': { claims: 2.6, pas: 2.0 },  // Slower (govt)
        'Superior (TX Medicaid)': { claims: 1.7, pas: 1.4 },  // Fast (excellent performer)
        'Anthem BCBS': { claims: 3.0, pas: 2.3 },             // Slow
        'Anthem Blue Cross': { claims: 3.3, pas: 2.5 },       // Very slow
        'Molina Healthcare': { claims: 3.5, pas: 2.7 },       // Very slow
        'BCBSM': { claims: 3.8, pas: 2.9 }                    // Slowest
      };

      const times = processingTimes[payerName] || { claims: 2.3, pas: 1.7 };
      const avgClaimsProcessing = times.claims;
      const avgPAProcessing = times.pas;

      // Overall performance (weighted average)
      const totalVolume = claimsVolume + paVolume;
      const overallPerformance = totalVolume > 0 ?
        Math.round(((claimsAcceptanceRate * claimsVolume) + (paApprovalRate * paVolume)) / totalVolume) : 0;

      return {
        payerName,
        claimsVolume,
        claimsAcceptanceRate,
        avgClaimsProcessing,
        paVolume,
        paApprovalRate,
        avgPAProcessing,
        overallPerformance
      };
    }).sort((a, b) => b.overallPerformance - a.overallPerformance); // Sort by overall performance desc
  }, []);

  // Compute combined KPI data when "All" is selected
  const combinedKPIData = useMemo(() => {
    // Total items processed (claims + PAs)
    const totalClaims = initialClaims.length;
    const totalPAs = initialClaims.filter(claim => claim.pa_status).length;
    const totalItems = totalClaims + totalPAs;

    // Overall automation rate (weighted average)
    const automatedClaims = initialClaims.filter(claim =>
      claim.status === 'submitted' || claim.status === 'accepted_277ca' || claim.status === 'paid'
    ).length;
    const automatedPAs = initialClaims.filter(claim =>
      claim.pa_status === 'auto-approved' || claim.pa_status === 'auto-processing'
    ).length;
    const overallAutomationRate = totalItems > 0 ?
      Math.round(((automatedClaims + automatedPAs) / totalItems) * 100) : 0;

    // Average processing time (weighted average - using mock data for demonstration)
    const avgClaimsProcessingHours = 2.5; // Mock data
    const avgPAsProcessingHours = 1.8; // Mock data
    const weightedAvgProcessingTime = totalItems > 0 ?
      ((avgClaimsProcessingHours * totalClaims) + (avgPAsProcessingHours * totalPAs)) / totalItems : 0;

    // Unique patients served (deduplicated)
    const uniquePatients = new Set([
      ...initialClaims.map(claim => claim.patient.id),
      ...initialClaims.filter(claim => claim.pa_status).map(claim => claim.patient.id)
    ]);

    return {
      totalItems,
      totalClaims,
      totalPAs,
      overallAutomationRate,
      avgProcessingTime: weightedAvgProcessingTime,
      patientsServed: uniquePatients.size
    };
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Performance insights and trends for PA automation and RCM analytics
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center justify-between">
        {/* Sub-tabs */}
        <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className="text-sm h-8"
          >
            All
          </Button>
          <Button
            variant={activeTab === 'claims' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('claims')}
            className="text-sm h-8"
          >
            Claims
          </Button>
          <Button
            variant={activeTab === 'pas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('pas')}
            className="text-sm h-8"
          >
            PAs
          </Button>
        </div>

        {/* Time period selectors (moved from header) */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div className="flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
          <Button
            variant={selectedTimeRange === '7d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTimeRange('7d')}
            className="text-sm h-8"
          >
            7 days
          </Button>
          <Button
            variant={selectedTimeRange === '30d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTimeRange('30d')}
            className="text-sm h-8"
          >
            30 days
          </Button>
          <Button
            variant={selectedTimeRange === '90d' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTimeRange('90d')}
            className="text-sm h-8"
          >
            90 days
          </Button>
          <Button
            variant={selectedTimeRange === '1y' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTimeRange('1y')}
            className="text-sm h-8"
          >
            1 year
          </Button>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      {activeTab === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Combined Data - Total Items Processed */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items Processed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{combinedKPIData.totalItems.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+15% vs last month</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Claims: {combinedKPIData.totalClaims} • PAs: {combinedKPIData.totalPAs}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Automation Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{combinedKPIData.overallAutomationRate}%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+7% vs last month</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Weighted average across all items</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Processing Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{combinedKPIData.avgProcessingTime.toFixed(1)}h</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">-18min vs last month</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Weighted average processing time</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Patients Served</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{combinedKPIData.patientsServed.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+11% vs last month</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Unique patients across all items</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      ) : activeTab === 'claims' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Claims-specific KPIs */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Claims Processed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{combinedKPIData.totalClaims.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Claims Automation Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">85%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+4% vs last month</span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Claims Processing</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">2.5h</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Claims Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">92%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+3% vs last month</span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total PAs Processed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{combinedKPIData.totalPAs.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+18% vs last month</span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PA Automation Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">89%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+9% vs last month</span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg PA Processing</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">1.8h</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">-15min vs last month</span>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PA Approval Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">87%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+5% vs last month</span>
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

      {/* Automation & Quality Over Time - Combined */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Automation & Quality Over Time - {activeTab === 'all' ? 'Combined' : activeTab === 'claims' ? 'Claims' : 'PAs'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeTab === 'all'
              ? 'Weighted combination of automation rates and quality scores from both Claims and PAs'
              : activeTab === 'claims'
              ? 'Claims automation and quality trends over time'
              : 'Prior Authorization automation and quality trends over time'
            }
          </p>
        </div>
        <div className="space-y-4">
          {combinedAutomationTrends.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.month}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-900 dark:text-gray-100">
                    {activeTab === 'all' ? item.combinedAutomation
                     : activeTab === 'claims' ? item.claimsAutomation
                     : item.pasAutomation}% automated
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400">
                    {activeTab === 'all' ? item.combinedQuality
                     : activeTab === 'claims' ? item.claimsQuality
                     : item.pasQuality}% quality
                  </span>
                </div>
              </div>

              {/* Automation Rate Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Automation Rate</span>
                  <span className="text-gray-500">
                    {activeTab === 'all' ? item.combinedAutomation
                     : activeTab === 'claims' ? item.claimsAutomation
                     : item.pasAutomation}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, activeTab === 'all' ? item.combinedAutomation
                               : activeTab === 'claims' ? item.claimsAutomation
                               : item.pasAutomation))}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Quality Score Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Quality Score</span>
                  <span className="text-gray-500">
                    {activeTab === 'all' ? item.combinedQuality
                     : activeTab === 'claims' ? item.claimsQuality
                     : item.pasQuality}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${activeTab === 'all' ? item.combinedQuality
                               : activeTab === 'claims' ? item.claimsQuality
                               : item.pasQuality}%`,
                      backgroundColor: '#06b6d4'
                    }}
                  >
                  </div>
                </div>
              </div>

              {/* Breakdown for "All" tab */}
              {activeTab === 'all' && (
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div>Claims: {item.claimsAutomation}% automation, {item.claimsQuality}% quality</div>
                  <div>PAs: {item.pasAutomation}% automation, {item.pasQuality}% quality</div>
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
            Payer Performance Analysis - {activeTab === 'all' ? 'Combined View' : activeTab === 'claims' ? 'Claims Only' : 'PAs Only'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeTab === 'all'
              ? 'Performance metrics across both Claims and Prior Authorizations'
              : activeTab === 'claims'
              ? 'Claims performance metrics across all payers'
              : 'Prior Authorization performance metrics across all payers'
            }
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Payer</th>
                {activeTab === 'all' && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Claims Acceptance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">PA Approval</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Avg Claims Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Avg PA Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Claims Vol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">PA Vol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Overall Performance</th>
                  </>
                )}
                {activeTab === 'claims' && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Claims Acceptance Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Avg Processing Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Volume</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Performance</th>
                  </>
                )}
                {activeTab === 'pas' && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">PA Approval Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Avg Processing Time</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Volume</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Performance</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {combinedPayerData
                .filter(payer => {
                  // Filter based on active tab to only show rows with relevant data
                  if (activeTab === 'claims') {
                    return payer.claimsVolume > 0;
                  } else if (activeTab === 'pas') {
                    return payer.paVolume > 0;
                  }
                  // For 'all' tab, show all payers
                  return true;
                })
                .map((payer, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">{payer.payerName}</td>

                  {activeTab === 'all' && (
                    <>
                      {/* Claims Acceptance Rate */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 dark:text-gray-100">{payer.claimsAcceptanceRate}%</span>
                          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                payer.claimsAcceptanceRate >= 85 ? 'bg-green-500' :
                                payer.claimsAcceptanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${payer.claimsAcceptanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* PA Approval Rate */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 dark:text-gray-100">{payer.paApprovalRate}%</span>
                          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                payer.paApprovalRate >= 85 ? 'bg-green-500' :
                                payer.paApprovalRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${payer.paApprovalRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Processing Times */}
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.avgClaimsProcessing}h</td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.avgPAProcessing}h</td>

                      {/* Volumes */}
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.claimsVolume}</td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.paVolume}</td>

                      {/* Overall Performance */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">{payer.overallPerformance}%</span>
                          <Badge
                            variant="default"
                            className={
                              payer.overallPerformance >= 85 ? 'bg-green-100 text-green-800' :
                              payer.overallPerformance >= 75 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {payer.overallPerformance >= 85 ? 'Excellent' :
                             payer.overallPerformance >= 75 ? 'Good' : 'Needs Attention'}
                          </Badge>
                        </div>
                      </td>
                    </>
                  )}

                  {activeTab === 'claims' && (
                    <>
                      {/* Claims Acceptance Rate */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 dark:text-gray-100">{payer.claimsAcceptanceRate}%</span>
                          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                payer.claimsAcceptanceRate >= 85 ? 'bg-green-500' :
                                payer.claimsAcceptanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${payer.claimsAcceptanceRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Processing Time */}
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.avgClaimsProcessing}h</td>

                      {/* Volume */}
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.claimsVolume}</td>

                      {/* Performance */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">{payer.claimsAcceptanceRate}%</span>
                          <Badge
                            variant="default"
                            className={
                              payer.claimsAcceptanceRate >= 85 ? 'bg-green-100 text-green-800' :
                              payer.claimsAcceptanceRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {payer.claimsAcceptanceRate >= 85 ? 'Excellent' :
                             payer.claimsAcceptanceRate >= 75 ? 'Good' : 'Needs Attention'}
                          </Badge>
                        </div>
                      </td>
                    </>
                  )}

                  {activeTab === 'pas' && (
                    <>
                      {/* PA Approval Rate */}
                      <td className="py-4 px-4">
                        {payer.paVolume > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-gray-100">{payer.paApprovalRate}%</span>
                            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  payer.paApprovalRate >= 85 ? 'bg-green-500' :
                                  payer.paApprovalRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${payer.paApprovalRate}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No PAs</span>
                        )}
                      </td>

                      {/* Processing Time */}
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                        {payer.paVolume > 0 ? `${payer.avgPAProcessing}h` : '—'}
                      </td>

                      {/* Volume */}
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{payer.paVolume}</td>

                      {/* Performance */}
                      <td className="py-4 px-4">
                        {payer.paVolume > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-gray-100 font-semibold">{payer.paApprovalRate}%</span>
                            <Badge
                              variant="default"
                              className={
                                payer.paApprovalRate >= 85 ? 'bg-green-100 text-green-800' :
                                payer.paApprovalRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {payer.paApprovalRate >= 85 ? 'Excellent' :
                               payer.paApprovalRate >= 75 ? 'Good' : 'Needs Attention'}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-500">
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

      {/* Denial Management & Analytics Section */}
      {distribution && (
        <AnalyticsOverview statusDistribution={distribution} claimItems={initialClaims} activeTab={activeTab} />
      )}

      {/* Claims-specific sections - only show when Claims tab is selected */}
      {activeTab === 'claims' && (
        <>
          {/* RCM Stage Analytics Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <RCMStageAnalytics stageMetrics={stageMetrics} />
          </div>

          {/* A/R Details Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <ARAnalytics claims={initialClaims} rcmMetrics={rcmMetrics} />
          </div>
        </>
      )}

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
