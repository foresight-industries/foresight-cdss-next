'use client';

import React from 'react';
import { SilentErrorBoundary } from '../error-boundary';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartErrorBoundaryProps {
  children: React.ReactNode;
  chartName?: string;
  onRetry?: () => void;
  height?: number;
}

export default function ChartErrorBoundary({
  children,
  chartName = "chart",
  onRetry,
  height = 200,
}: Readonly<ChartErrorBoundaryProps>) {
  return (
    <SilentErrorBoundary
      feature={chartName}
      fallback={(error, reset) => (
        <div
          className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg bg-gray-50"
          style={{ height: `${height}px` }}
        >
          <BarChart3 className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-3 text-center max-w-xs">
            Unable to load {chartName}
          </p>
          <Button
            onClick={() => {
              onRetry?.();
              reset();
            }}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-2 max-w-xs">
              <summary className="cursor-pointer text-xs text-gray-500">
                Debug
              </summary>
              <pre className="text-xs font-mono text-gray-500 mt-1 p-1 bg-gray-100 rounded overflow-auto max-h-20">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      )}
    >
      {children}
    </SilentErrorBoundary>
  );
}
