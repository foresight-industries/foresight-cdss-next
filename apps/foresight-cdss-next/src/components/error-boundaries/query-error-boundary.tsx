'use client';

import React from 'react';
import { FeatureErrorBoundary } from '../error-boundary';
import { Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  queryName?: string;
  onRetry?: () => void;
}

export default function QueryErrorBoundary({
  children,
  queryName = "data",
  onRetry,
}: Readonly<QueryErrorBoundaryProps>) {
  return (
    <FeatureErrorBoundary
      feature={`${queryName} query`}
      fallback={(error, reset) => (
        <Card className="border-amber-200 bg-amber-50 m-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-amber-900 mb-1">
                  Failed to load {queryName}
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  We couldn&apos;t fetch the latest {queryName}. This might be
                  due to a temporary network issue or server problem.
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onRetry?.();
                      reset();
                    }}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>

                {process.env.NODE_ENV === "development" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-amber-700">
                      Error Details
                    </summary>
                    <pre className="mt-1 text-xs font-mono text-amber-700 bg-amber-50 p-2 rounded border overflow-auto">
                      {error.message}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    >
      {children}
    </FeatureErrorBoundary>
  );
}
