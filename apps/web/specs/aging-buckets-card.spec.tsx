import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgingBucketsCard } from '../src/components/dashboard/aging-buckets-card';
import type { AgingBuckets } from '../src/utils/dashboard';

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

describe('AgingBucketsCard', () => {
  const mockBuckets: AgingBuckets = {
    '0-30': 50000,
    '31-60': 30000,
    '61-90': 20000,
    '90+': 15000,
  };

  const mockCounts: AgingBuckets = {
    '0-30': 25,
    '31-60': 15,
    '61-90': 10,
    '90+': 8,
  };

  const totalOutstandingAR = 115000;

  describe('Link and Navigation', () => {
    it('should render as a clickable link with correct href', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      const linkElement = screen.getByRole('link');
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute('href', '/team/test-team/analytics#ar-details');
    });

    it('should use default href when no team slug is available', () => {
      // Create a temporary mock for this test
      const mockUseParams = jest.fn(() => ({}));
      const mockUseRouter = jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
      }));

      jest.doMock('next/navigation', () => ({
        useParams: mockUseParams,
        useRouter: mockUseRouter,
      }));

      // Force re-evaluation of the module
      jest.resetModules();

      // Re-import the component with the new mock
      const { AgingBucketsCard: TestComponent } = require('../src/components/dashboard/aging-buckets-card');

      const { unmount } = render(
        <TestComponent
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      const linkElement = screen.getByRole('link');
      expect(linkElement).toHaveAttribute('href', '/analytics#ar-details');

      unmount();
    });

    it('should apply hover effects to the card', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      const cardElement = screen.getByRole('link').firstChild as HTMLElement;
      expect(cardElement).toHaveClass('hover:translate-y-[-2px]');
      expect(cardElement).toHaveClass('hover:shadow-lg');
      expect(cardElement).toHaveClass('cursor-pointer');
    });
  });

  describe('Content Display', () => {
    it('should display correct total amount', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      expect(screen.getByText('Total: $115,000')).toBeInTheDocument();
    });

    it('should display A/R Aging Buckets title', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      expect(screen.getByText('A/R Aging Buckets')).toBeInTheDocument();
    });

    it('should display navigation arrow', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      const arrowElement = screen.getByRole('link').querySelector('svg');
      expect(arrowElement).toBeInTheDocument();
      expect(arrowElement).toHaveClass('w-3', 'h-3');
    });
  });

  describe('Aging Buckets Chart and Data', () => {
    it('should render chart container when there is outstanding A/R', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      // Check for chart elements (Recharts components)
      const chartContainer = screen.getByRole('link').querySelector('[class*="recharts"]');
      expect(chartContainer).toBeTruthy();
    });

    it('should display legend with amounts, counts, and percentages', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      // Check for bucket labels
      expect(screen.getByText('0-30 days')).toBeInTheDocument();
      expect(screen.getByText('31-60 days')).toBeInTheDocument();
      expect(screen.getByText('61-90 days')).toBeInTheDocument();
      expect(screen.getByText('90+ days')).toBeInTheDocument();

      // Check for amounts and counts
      expect(screen.getByText('$50,000 (25 claims)')).toBeInTheDocument();
      expect(screen.getByText('$30,000 (15 claims)')).toBeInTheDocument();
      expect(screen.getByText('$20,000 (10 claims)')).toBeInTheDocument();
      expect(screen.getByText('$15,000 (8 claims)')).toBeInTheDocument();

      // Check for percentages
      expect(screen.getByText('43.5%')).toBeInTheDocument(); // 50000/115000
      expect(screen.getByText('26.1%')).toBeInTheDocument(); // 30000/115000
      expect(screen.getByText('17.4%')).toBeInTheDocument(); // 20000/115000
      expect(screen.getByText('13.0%')).toBeInTheDocument(); // 15000/115000
    });

    it('should only show buckets with amounts > 0', () => {
      const sparseBuckets: AgingBuckets = {
        '0-30': 50000,
        '31-60': 0,
        '61-90': 0,
        '90+': 15000,
      };

      const sparseCounts: AgingBuckets = {
        '0-30': 25,
        '31-60': 0,
        '61-90': 0,
        '90+': 8,
      };

      render(
        <AgingBucketsCard
          buckets={sparseBuckets}
          counts={sparseCounts}
          totalOutstandingAR={65000}
        />
      );

      // Should show only non-zero buckets
      expect(screen.getByText('0-30 days')).toBeInTheDocument();
      expect(screen.queryByText('31-60 days')).not.toBeInTheDocument();
      expect(screen.queryByText('61-90 days')).not.toBeInTheDocument();
      expect(screen.getByText('90+ days')).toBeInTheDocument();
    });
  });

  describe('Risk Indicators', () => {
    it('should show critical indicator for 90+ days bucket', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      expect(screen.getByText('Critical: $15,000 in 90+ days')).toBeInTheDocument();
    });

    it('should show percentage for critical buckets > 20%', () => {
      const highCriticalBuckets: AgingBuckets = {
        '0-30': 30000,
        '31-60': 20000,
        '61-90': 10000,
        '90+': 40000, // 40% of total
      };

      const highCriticalCounts: AgingBuckets = {
        '0-30': 15,
        '31-60': 10,
        '61-90': 5,
        '90+': 20,
      };

      render(
        <AgingBucketsCard
          buckets={highCriticalBuckets}
          counts={highCriticalCounts}
          totalOutstandingAR={100000}
        />
      );

      expect(screen.getByText(/Critical: \$40,000 in 90\+ days \(40\.0% of total\)/)).toBeInTheDocument();
    });

    it('should style total amount as high-risk when 90+ bucket exists', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      const totalElement = screen.getByText('Total: $115,000');
      expect(totalElement).toHaveClass('text-red-600');
    });

    it('should not show critical indicator when no 90+ bucket', () => {
      const noCriticalBuckets: AgingBuckets = {
        '0-30': 50000,
        '31-60': 30000,
        '61-90': 20000,
        '90+': 0,
      };

      const noCriticalCounts: AgingBuckets = {
        '0-30': 25,
        '31-60': 15,
        '61-90': 10,
        '90+': 0,
      };

      render(
        <AgingBucketsCard
          buckets={noCriticalBuckets}
          counts={noCriticalCounts}
          totalOutstandingAR={100000}
        />
      );

      expect(screen.queryByText(/Critical:/)).not.toBeInTheDocument();

      const totalElement = screen.getByText('Total: $100,000');
      expect(totalElement).not.toHaveClass('text-red-600');
    });
  });

  describe('Empty State', () => {
    it('should show no outstanding A/R message when total is 0', () => {
      const emptyBuckets: AgingBuckets = {
        '0-30': 0,
        '31-60': 0,
        '61-90': 0,
        '90+': 0,
      };

      const emptyCounts: AgingBuckets = {
        '0-30': 0,
        '31-60': 0,
        '61-90': 0,
        '90+': 0,
      };

      render(
        <AgingBucketsCard
          buckets={emptyBuckets}
          counts={emptyCounts}
          totalOutstandingAR={0}
        />
      );

      expect(screen.getByText('No outstanding A/R')).toBeInTheDocument();
      expect(screen.getByText('Total: $0')).toBeInTheDocument();
    });
  });

  describe('Tooltip Integration', () => {
    it('should wrap content in tooltip when tooltip prop is provided', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
          tooltip="This shows aging analysis"
        />
      );

      // Should still render the link and content
      const linkElement = screen.getByRole('link');
      expect(linkElement).toBeInTheDocument();
      expect(linkElement).toHaveAttribute('href', '/team/test-team/analytics#ar-details');
    });

    it('should render without tooltip wrapper when no tooltip prop', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      const linkElement = screen.getByRole('link');
      expect(linkElement).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should apply correct color coding to bucket elements', () => {
      render(
        <AgingBucketsCard
          buckets={mockBuckets}
          counts={mockCounts}
          totalOutstandingAR={totalOutstandingAR}
        />
      );

      // Check for colored squares in legend - they have class "w-3 h-3 rounded" and style backgroundColor
      const legendSquares = screen.getByRole('link').querySelectorAll('.w-3.h-3.rounded, [class*="w-3"][class*="h-3"][class*="rounded"]');
      expect(legendSquares.length).toBeGreaterThanOrEqual(4); // At least 4 colored squares for buckets
    });
  });
});
