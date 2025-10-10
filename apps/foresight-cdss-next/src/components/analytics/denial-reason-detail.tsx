'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  FileText,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { DenialReasonAnalysis } from '@/data/denial-reasons';

interface DenialReasonDetailProps {
  analysis: DenialReasonAnalysis;
  onBack: () => void;
  onAutomate?: (action: string) => void;
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format claim/PA ID for display
const formatItemId = (id: string): string => {
  return id.replace(/^(CLM-|PA-CLM-)/, '');
};

// Get priority color
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-red-50 text-red-700 border-red-200';
    case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'low': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

// Colors for payer pie chart
const PAYER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function DenialReasonDetail({ analysis, onBack, onAutomate }: DenialReasonDetailProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'claims' | 'resolution'>('overview');

  const { reason, claimCount, totalAmount, averageDaysInAR, payerBreakdown, claims } = analysis;
  
  // Detect if this is a PA denial (PA codes start with 'PA')
  const isPADenial = reason.code.startsWith('PA');
  const itemType = isPADenial ? 'Prior Auth' : 'Claim';
  const itemTypePlural = isPADenial ? 'Prior Auths' : 'Claims';
  const itemTypeLower = isPADenial ? 'prior auth' : 'claim';
  const itemTypePluralLower = isPADenial ? 'prior auths' : 'claims';

  // Prepare payer chart data
  const payerChartData = payerBreakdown.slice(0, 6).map((item, index) => ({
    ...item,
    color: PAYER_COLORS[index] || '#6B7280'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Denial Reasons
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-foreground">{reason.description}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Code: {reason.code} • Category: {reason.category}
          </p>
        </div>
        <Badge className={getPriorityColor(reason.resolution.priority)}>
          {reason.resolution.priority.toUpperCase()} PRIORITY
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Affected {itemTypePlural}</p>
                <p className="text-2xl font-bold text-foreground">{claimCount}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Days in A/R</p>
                <p className="text-2xl font-bold text-foreground">{averageDaysInAR}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payers Affected</p>
                <p className="text-2xl font-bold text-foreground">{payerBreakdown.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex space-x-12">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'claims', label: `${itemTypePlural} List`, icon: FileText },
            { key: 'resolution', label: 'Resolution Guide', icon: Lightbulb }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                selectedTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payer Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{itemTypePlural} by Payer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={payerChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                    >
                      {payerChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name, props) => [
                        `${value} ${itemTypePluralLower}`, 
                        props.payload?.payer || 'Payer'
                      ]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend below chart */}
              <div className="mt-4 space-y-2">
                {payerChartData.map((item, index) => {
                  const percentage = payerChartData.reduce((sum, p) => sum + p.count, 0) > 0 
                    ? (item.count / payerChartData.reduce((sum, p) => sum + p.count, 0) * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div key={item.payer} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-foreground truncate" title={item.payer}>
                          {item.payer}
                        </span>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <span className="font-medium">{item.count} {itemTypePluralLower}</span>
                        <span className="text-muted-foreground ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Common Cause & Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis & Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Common Cause</h4>
                <p className="text-sm text-muted-foreground">{reason.commonCause}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-foreground mb-2">Financial Impact</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Average {itemTypeLower} value:</span>
                    <span className="font-medium">{formatCurrency(totalAmount / claimCount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated resolution time:</span>
                    <span className="font-medium">{reason.resolution.timeframe}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-foreground mb-2">Top Affected Payers</h4>
                <div className="space-y-2">
                  {payerBreakdown.slice(0, 3).map((payer, index) => (
                    <div key={payer.payer} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PAYER_COLORS[index] }}
                        />
                        <span className="text-foreground">{payer.payer}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{payer.count} {itemTypePluralLower}</div>
                        <div className="text-muted-foreground">{formatCurrency(payer.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'claims' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Affected {itemTypePlural}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground">{itemType} ID</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Payer</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">DOS</th>
                    <th className="text-right p-2 font-medium text-muted-foreground">Days in A/R</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => {
                    const daysInAR = Math.floor(
                      (Date.now() - new Date(claim.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <tr key={claim.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-sm">{formatItemId(claim.id)}</td>
                        <td className="p-2">{claim.patient.name}</td>
                        <td className="p-2">{claim.payer.name}</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(claim.total_amount)}</td>
                        <td className="p-2 text-right">{claim.dos}</td>
                        <td className="p-2 text-right">{daysInAR}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {claim.status.replace('_', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'resolution' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resolution Steps */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  {reason.resolution.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {reason.resolution.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated time:</span>
                    <span className="font-medium">{reason.resolution.timeframe}</span>
                  </div>

                  {!reason.resolution.canAutomate && (
                    <>
                      <Separator />

                      <div>
                        <h4 className="font-medium text-foreground mb-3">Resolution Steps</h4>
                        <div className="space-y-3">
                          {reason.resolution.steps.map((step, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <p className="text-sm text-foreground mt-0.5">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {reason.resolution.canAutomate && (
                    <>
                      <Separator />
                      <Alert>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-green-700">
                                Automated Fix Applied
                              </span>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Completed
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {reason.resolution.automaticAction} was automatically processed for {claimCount} affected {itemTypePluralLower}.
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Estimated recovery: {formatCurrency(totalAmount)} • Completed in {reason.resolution.timeframe}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prevention Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Prevention Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reason.resolution.preventionTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
