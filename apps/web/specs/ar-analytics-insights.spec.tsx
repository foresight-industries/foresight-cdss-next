import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ARAnalytics } from '../src/components/analytics/ar-analytics';
import type { Claim, ClaimStatus } from '../src/data/claims';
import type { RCMMetrics } from '../src/utils/dashboard';

// Mock ResizeObserver for Recharts
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Next.js router since the component uses it
jest.mock('next/navigation', () => ({
  useParams: () => ({
    slug: 'test-team',
  }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Recharts components to avoid canvas rendering issues
jest.mock('recharts', () => ({
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey }: any) => <div data-testid={`bar-${dataKey}`}>{dataKey}</div>,
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`}>{dataKey}</div>,
  XAxis: ({ dataKey }: any) => <div data-testid={`x-axis-${dataKey}`}></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
  Legend: () => <div data-testid="legend"></div>,
  Cell: () => <div data-testid="cell"></div>,
}));

// Mock ChartContainer and other UI components
jest.mock('../src/components/ui/chart', () => ({
  ChartContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  ChartTooltip: ({ content }: any) => <div data-testid="chart-tooltip">{content}</div>,
  ChartTooltipContent: ({ children }: any) => <div data-testid="chart-tooltip-content">{children}</div>,
}));

// Helper function to create a mock claim
const createMockClaim = (
  id: string,
  status: ClaimStatus,
  totalAmount: number,
  dos: string,
  payerName = 'Test Insurance'
): Claim => ({
  id,
  encounter_id: `enc-${id}`,
  patient: { id: parseInt(id), name: `Patient ${id}` },
  payer: { id: 1, name: payerName },
  dos,
  visit_type: 'Office Visit',
  state: 'NY',
  total_amount: totalAmount,
  status,
  confidence: 0.95,
  issues: [],
  suggested_fixes: [],
  validation_results: [],
  field_confidences: {},
  auto_submitted: false,
  attempt_count: 1,
  state_history: [],
  chart_note: {
    provider: 'Dr. Test',
    paragraphs: [[{ text: 'Test note' }]]
  },
  codes: {
    icd10: ['Z00.00'],
    cpt: [{ code: '99213', description: 'Office Visit', amount: totalAmount }],
    pos: '11'
  },
  provider: 'Dr. Test',
  updatedAt: '2024-01-01T12:00:00Z'
});

// Helper function to create date string X days ago
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// Helper function to create mock RCM metrics
const createMockRCMMetrics = (overrides: Partial<RCMMetrics> = {}): RCMMetrics => ({
  daysInAR: 30,
  maxDaysOutstanding: 60,
  agingBuckets: {
    '0-30': 50000,
    '31-60': 30000,
    '61-90': 0,
    '90+': 0,
  },
  agingCounts: {
    '0-30': 25,
    '31-60': 15,
    '61-90': 0,
    '90+': 0,
  },
  totalOutstandingAR: 80000,
  ...overrides,
});

describe('ARAnalytics Insights Logic', () => {
  describe('Critical Aging Insights (90+ Days)', () => {
    it('should trigger urgent alert for claims > 90 days outstanding', () => {
      const criticalClaims = [
        createMockClaim('1', 'accepted_277ca', 5000, daysAgo(95)),
        createMockClaim('2', 'accepted_277ca', 3000, daysAgo(125)),
      ];

      const criticalMetrics = createMockRCMMetrics({
        maxDaysOutstanding: 125,
        agingBuckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 8000 },
        agingCounts: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 2 },
        totalOutstandingAR: 8000,
      });

      render(<ARAnalytics claims={criticalClaims} rcmMetrics={criticalMetrics} />);

      expect(screen.getByText(/Urgent: Claims outstanding for 125 days require immediate attention/)).toBeInTheDocument();
      expect(screen.getByText(/Critical aging: \$8,000 in 90\+ days bucket \(2 claims\) - prioritize follow-up/)).toBeInTheDocument();
    });

    it('should show percentage warning when 90+ bucket > 20% of total AR', () => {
      const highCriticalClaims = [
        createMockClaim('1', 'accepted_277ca', 25000, daysAgo(100)), // 90+ bucket
        createMockClaim('2', 'accepted_277ca', 75000, daysAgo(30)),  // 0-30 bucket
      ];

      const highCriticalMetrics = createMockRCMMetrics({
        maxDaysOutstanding: 100,
        agingBuckets: { '0-30': 75000, '31-60': 0, '61-90': 0, '90+': 25000 },
        agingCounts: { '0-30': 1, '31-60': 0, '61-90': 0, '90+': 1 },
        totalOutstandingAR: 100000,
      });

      render(<ARAnalytics claims={highCriticalClaims} rcmMetrics={highCriticalMetrics} />);

      expect(screen.getByText(/High concern: 25\.0% of total A\/R is aging 90\+ days - investigate potential collection issues/)).toBeInTheDocument();
    });

    it('should not show percentage warning when 90+ bucket <= 20%', () => {
      const lowCriticalClaims = [
        createMockClaim('1', 'accepted_277ca', 15000, daysAgo(100)), // 90+ bucket (15%)
        createMockClaim('2', 'accepted_277ca', 85000, daysAgo(30)),  // 0-30 bucket
      ];

      const lowCriticalMetrics = createMockRCMMetrics({
        maxDaysOutstanding: 100,
        agingBuckets: { '0-30': 85000, '31-60': 0, '61-90': 0, '90+': 15000 },
        agingCounts: { '0-30': 1, '31-60': 0, '61-90': 0, '90+': 1 },
        totalOutstandingAR: 100000,
      });

      render(<ARAnalytics claims={lowCriticalClaims} rcmMetrics={lowCriticalMetrics} />);

      expect(screen.queryByText(/High concern.*% of total A\/R is aging 90\+ days/)).not.toBeInTheDocument();
    });
  });

  describe('Old Buckets Analysis (60+ Days)', () => {
    it('should warn when combined 61-90 and 90+ buckets > 40% of total', () => {
      const oldBucketsClaims = [
        createMockClaim('1', 'accepted_277ca', 20000, daysAgo(30)),  // 0-30
        createMockClaim('2', 'accepted_277ca', 35000, daysAgo(70)),  // 61-90
        createMockClaim('3', 'accepted_277ca', 25000, daysAgo(100)), // 90+
      ];

      const oldBucketsMetrics = createMockRCMMetrics({
        agingBuckets: { '0-30': 20000, '31-60': 0, '61-90': 35000, '90+': 25000 },
        agingCounts: { '0-30': 1, '31-60': 0, '61-90': 1, '90+': 1 },
        totalOutstandingAR: 80000, // 60k out of 80k = 75% > 40%
      });

      render(<ARAnalytics claims={oldBucketsClaims} rcmMetrics={oldBucketsMetrics} />);

      expect(screen.getByText(/75\.0% of A\/R is older than 60 days - review collection processes and payer relationships/)).toBeInTheDocument();
    });

    it('should not warn when old buckets <= 40%', () => {
      const goodAgingClaims = [
        createMockClaim('1', 'accepted_277ca', 70000, daysAgo(30)),  // 0-30
        createMockClaim('2', 'accepted_277ca', 20000, daysAgo(45)),  // 31-60
        createMockClaim('3', 'accepted_277ca', 10000, daysAgo(100)), // 90+ (only 10%)
      ];

      const goodAgingMetrics = createMockRCMMetrics({
        agingBuckets: { '0-30': 70000, '31-60': 20000, '61-90': 0, '90+': 10000 },
        totalOutstandingAR: 100000, // 10k out of 100k = 10% < 40%
      });

      render(<ARAnalytics claims={goodAgingClaims} rcmMetrics={goodAgingMetrics} />);

      expect(screen.queryByText(/% of A\/R is older than 60 days/)).not.toBeInTheDocument();
    });
  });

  describe('Days in AR Analysis', () => {
    it('should warn when average days in AR > 40', () => {
      const highARClaims = [
        createMockClaim('1', 'accepted_277ca', 50000, daysAgo(55)),
      ];

      const highARMetrics = createMockRCMMetrics({
        daysInAR: 55,
        totalOutstandingAR: 50000,
      });

      render(<ARAnalytics claims={highARClaims} rcmMetrics={highARMetrics} />);

      expect(screen.getByText(/Average Days in A\/R \(55\) exceeds target of 40 days/)).toBeInTheDocument();
    });

    it('should not warn when days in AR <= 40', () => {
      const goodARClaims = [
        createMockClaim('1', 'accepted_277ca', 50000, daysAgo(35)),
      ];

      const goodARMetrics = createMockRCMMetrics({
        daysInAR: 35,
        totalOutstandingAR: 50000,
      });

      render(<ARAnalytics claims={goodARClaims} rcmMetrics={goodARMetrics} />);

      expect(screen.queryByText(/Average Days in A\/R.*exceeds target/)).not.toBeInTheDocument();
    });

    it('should handle null daysInAR gracefully', () => {
      const noClaims: Claim[] = [];

      const noARMetrics = createMockRCMMetrics({
        daysInAR: null,
        totalOutstandingAR: 0,
      });

      render(<ARAnalytics claims={noClaims} rcmMetrics={noARMetrics} />);

      expect(screen.queryByText(/Average Days in A\/R.*exceeds target/)).not.toBeInTheDocument();
    });
  });

  describe('Payer-Specific Insights', () => {
    it('should identify problematic payers with 3+ claims in 90+ days', () => {
      const problematicPayerClaims = [
        createMockClaim('1', 'accepted_277ca', 5000, daysAgo(95), 'Problematic Insurance'),
        createMockClaim('2', 'accepted_277ca', 3000, daysAgo(100), 'Problematic Insurance'),
        createMockClaim('3', 'accepted_277ca', 2000, daysAgo(105), 'Problematic Insurance'),
        createMockClaim('4', 'accepted_277ca', 1000, daysAgo(30), 'Good Insurance'), // Different payer
      ];

      const problematicPayerMetrics = createMockRCMMetrics({
        agingBuckets: { '0-30': 1000, '31-60': 0, '61-90': 0, '90+': 10000 },
        agingCounts: { '0-30': 1, '31-60': 0, '61-90': 0, '90+': 3 },
        totalOutstandingAR: 11000,
      });

      render(<ARAnalytics claims={problematicPayerClaims} rcmMetrics={problematicPayerMetrics} />);

      expect(screen.getByText(/Problematic Insurance has 3 claims in 90\+ days totaling \$10,000 - investigate payer issues/)).toBeInTheDocument();
    });

    it('should not flag payers with < 3 claims in 90+ days', () => {
      const acceptablePayerClaims = [
        createMockClaim('1', 'accepted_277ca', 5000, daysAgo(95), 'Acceptable Insurance'),
        createMockClaim('2', 'accepted_277ca', 3000, daysAgo(100), 'Acceptable Insurance'), // Only 2 claims
        createMockClaim('3', 'accepted_277ca', 1000, daysAgo(30), 'Good Insurance'),
      ];

      const acceptablePayerMetrics = createMockRCMMetrics({
        agingBuckets: { '0-30': 1000, '31-60': 0, '61-90': 0, '90+': 8000 },
        totalOutstandingAR: 9000,
      });

      render(<ARAnalytics claims={acceptablePayerClaims} rcmMetrics={acceptablePayerMetrics} />);

      expect(screen.queryByText(/Acceptable Insurance has.*claims in 90\+ days.*investigate payer issues/)).not.toBeInTheDocument();
    });

    it('should rank problematic payers by total amount', () => {
      const multipleProblematicPayersClaims = [
        // Payer A: 3 claims totaling $15,000
        createMockClaim('1', 'accepted_277ca', 7000, daysAgo(95), 'Payer A'),
        createMockClaim('2', 'accepted_277ca', 5000, daysAgo(100), 'Payer A'),
        createMockClaim('3', 'accepted_277ca', 3000, daysAgo(105), 'Payer A'),
        // Payer B: 3 claims totaling $6,000  
        createMockClaim('4', 'accepted_277ca', 3000, daysAgo(95), 'Payer B'),
        createMockClaim('5', 'accepted_277ca', 2000, daysAgo(100), 'Payer B'),
        createMockClaim('6', 'accepted_277ca', 1000, daysAgo(105), 'Payer B'),
      ];

      const multipleProblematicMetrics = createMockRCMMetrics({
        agingBuckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 21000 },
        totalOutstandingAR: 21000,
      });

      render(<ARAnalytics claims={multipleProblematicPayersClaims} rcmMetrics={multipleProblematicMetrics} />);

      // Should show the payer with highest amount first (Payer A)
      expect(screen.getByText(/Payer A has 3 claims in 90\+ days totaling \$15,000 - investigate payer issues/)).toBeInTheDocument();
      
      // Should not show second payer (only shows top problematic payer)
      expect(screen.queryByText(/Payer B has.*investigate payer issues/)).not.toBeInTheDocument();
    });
  });

  describe('Default Acceptable Performance', () => {
    it('should show acceptable performance message when no issues detected', () => {
      const perfectClaims = [
        createMockClaim('1', 'accepted_277ca', 50000, daysAgo(25)),
        createMockClaim('2', 'accepted_277ca', 30000, daysAgo(20)),
      ];

      const perfectMetrics = createMockRCMMetrics({
        daysInAR: 22,
        maxDaysOutstanding: 25,
        agingBuckets: { '0-30': 80000, '31-60': 0, '61-90': 0, '90+': 0 },
        agingCounts: { '0-30': 2, '31-60': 0, '61-90': 0, '90+': 0 },
        totalOutstandingAR: 80000,
      });

      render(<ARAnalytics claims={perfectClaims} rcmMetrics={perfectMetrics} />);

      expect(screen.getByText('A/R performance is within acceptable ranges.')).toBeInTheDocument();
    });

    it('should not show acceptable message when any issue exists', () => {
      const issuesClaims = [
        createMockClaim('1', 'accepted_277ca', 50000, daysAgo(25)),
        createMockClaim('2', 'accepted_277ca', 30000, daysAgo(95)), // This will trigger 90+ bucket issue
      ];

      const issuesMetrics = createMockRCMMetrics({
        daysInAR: 30,
        maxDaysOutstanding: 95,
        agingBuckets: { '0-30': 50000, '31-60': 0, '61-90': 0, '90+': 30000 },
        agingCounts: { '0-30': 1, '31-60': 0, '61-90': 0, '90+': 1 },
        totalOutstandingAR: 80000,
      });

      render(<ARAnalytics claims={issuesClaims} rcmMetrics={issuesMetrics} />);

      expect(screen.queryByText('A/R performance is within acceptable ranges.')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Insights Combination', () => {
    it('should show multiple insights when multiple conditions are met', () => {
      const multipleIssuesClaims = [
        createMockClaim('1', 'accepted_277ca', 10000, daysAgo(50)),  // Good claim
        createMockClaim('2', 'accepted_277ca', 30000, daysAgo(95)),  // 90+ bucket  
        createMockClaim('3', 'accepted_277ca', 25000, daysAgo(100)), // 90+ bucket
        createMockClaim('4', 'accepted_277ca', 15000, daysAgo(70)),  // 61-90 bucket
      ];

      const multipleIssuesMetrics = createMockRCMMetrics({
        daysInAR: 78, // > 40 days
        maxDaysOutstanding: 100,
        agingBuckets: { '0-30': 10000, '31-60': 0, '61-90': 15000, '90+': 55000 },
        agingCounts: { '0-30': 1, '31-60': 0, '61-90': 1, '90+': 2 },
        totalOutstandingAR: 80000, // 70k/80k = 87.5% > 60 days, 55k/80k = 68.75% > 90+ days
      });

      render(<ARAnalytics claims={multipleIssuesClaims} rcmMetrics={multipleIssuesMetrics} />);

      // Should show multiple insights
      expect(screen.getByText(/Urgent: Claims outstanding for 100 days require immediate attention/)).toBeInTheDocument();
      expect(screen.getByText(/Critical aging: \$55,000 in 90\+ days bucket/)).toBeInTheDocument();
      expect(screen.getByText(/High concern: 68\.8% of total A\/R is aging 90\+ days/)).toBeInTheDocument();
      expect(screen.getByText(/87\.5% of A\/R is older than 60 days/)).toBeInTheDocument();
      expect(screen.getByText(/Average Days in A\/R \(78\) exceeds target of 40 days/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases for Insights', () => {
    it('should handle zero total outstanding AR gracefully', () => {
      const noClaims: Claim[] = [];

      const zeroMetrics = createMockRCMMetrics({
        daysInAR: null,
        maxDaysOutstanding: null,
        agingBuckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        agingCounts: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        totalOutstandingAR: 0,
      });

      render(<ARAnalytics claims={noClaims} rcmMetrics={zeroMetrics} />);

      // Should show empty state instead of insights
      expect(screen.getByText('No Outstanding Claims')).toBeInTheDocument();
      expect(screen.queryByText(/Critical aging/)).not.toBeInTheDocument();
    });

    it('should handle very small amounts in percentage calculations', () => {
      const smallAmountClaims = [
        createMockClaim('1', 'accepted_277ca', 1, daysAgo(95)), // $1 in 90+ bucket
        createMockClaim('2', 'accepted_277ca', 99, daysAgo(30)), // $99 in 0-30 bucket
      ];

      const smallAmountMetrics = createMockRCMMetrics({
        agingBuckets: { '0-30': 99, '31-60': 0, '61-90': 0, '90+': 1 },
        agingCounts: { '0-30': 1, '31-60': 0, '61-90': 0, '90+': 1 },
        totalOutstandingAR: 100, // 1% in 90+ bucket
      });

      render(<ARAnalytics claims={smallAmountClaims} rcmMetrics={smallAmountMetrics} />);

      // Should not trigger high percentage warnings
      expect(screen.queryByText(/High concern.*% of total A\/R is aging 90\+ days/)).not.toBeInTheDocument();
    });

    it('should format currency amounts correctly in insights', () => {
      const largeClaims = [
        createMockClaim('1', 'accepted_277ca', 1500000, daysAgo(95)), // $1.5M
      ];

      const largeMetrics = createMockRCMMetrics({
        agingBuckets: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 1500000 },
        agingCounts: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 1 },
        totalOutstandingAR: 1500000,
      });

      render(<ARAnalytics claims={largeClaims} rcmMetrics={largeMetrics} />);

      expect(screen.getByText(/Critical aging: \$1,500,000 in 90\+ days bucket/)).toBeInTheDocument();
    });
  });
});