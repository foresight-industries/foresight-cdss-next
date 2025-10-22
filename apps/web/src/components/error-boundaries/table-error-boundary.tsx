'use client';

import React from 'react';
import { FeatureErrorBoundary } from '../error-boundary';
import { Table, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TableErrorBoundaryProps {
  children: React.ReactNode;
  tableName?: string;
  onRetry?: () => void;
  onExport?: () => void;
  showExport?: boolean;
}

export default function TableErrorBoundary({
  children,
  tableName = "table",
  onRetry,
  onExport,
  showExport = false,
}: Readonly<TableErrorBoundaryProps>) {
  return (
    <FeatureErrorBoundary
      feature={tableName}
      fallback={(error, reset) => (
        <Card className="border-blue-200 bg-blue-50 m-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Table className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-blue-900 mb-1">
                  Table Loading Error
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  The {tableName} couldn&apos;t be loaded. This might be due to a
                  large dataset or temporary server issue.
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onRetry?.();
                      reset();
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reload Table
                  </Button>

                  {showExport && onExport && (
                    <Button
                      onClick={onExport}
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export Data
                    </Button>
                  )}
                </div>

                <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> If this table contains a lot of
                    data, try using filters to reduce the dataset size.
                  </p>
                </div>

                {process.env.NODE_ENV === "development" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-blue-700">
                      Error Details
                    </summary>
                    <pre className="mt-1 text-xs font-mono text-blue-700 bg-blue-50 p-2 rounded border overflow-auto">
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
