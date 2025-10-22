'use client';

import React from 'react';
import { FeatureErrorBoundary } from '../error-boundary';
import { FileX, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FormErrorBoundaryProps {
  children: React.ReactNode;
  formName?: string;
  onRestore?: () => void;
  hasUnsavedData?: boolean;
}

export default function FormErrorBoundary({
  children,
  formName = "form",
  onRestore,
  hasUnsavedData = false,
}: Readonly<FormErrorBoundaryProps>) {
  return (
    <FeatureErrorBoundary
      feature={formName}
      fallback={(error, reset) => (
        <Card className="border-orange-200 bg-orange-50 m-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <FileX className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-orange-900 mb-1">Form Error</h3>
                <p className="text-sm text-orange-800 mb-3">
                  The {formName} encountered an error and couldn&apos;t be displayed.
                  {hasUnsavedData && " Your data may not have been saved."}
                </p>

                {hasUnsavedData && (
                  <div className="bg-orange-100 border border-orange-200 rounded p-3 mb-3">
                    <p className="text-xs text-orange-800 font-medium">
                      ⚠️ Unsaved Changes Detected
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      You may have unsaved changes. Try restoring the form or
                      refresh the page to start over.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={reset}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore Form
                  </Button>

                  {onRestore && (
                    <Button
                      onClick={() => {
                        onRestore();
                        reset();
                      }}
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Recover Data
                    </Button>
                  )}
                </div>

                {process.env.NODE_ENV === "development" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-orange-700">
                      Error Details
                    </summary>
                    <pre className="mt-1 text-xs font-mono text-orange-700 bg-orange-50 p-2 rounded border overflow-auto">
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
