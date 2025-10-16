'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RotateCcw, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void, errorId?: string) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean;
  feature?: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry with additional context
    const errorId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        feature: this.props.feature ? { name: this.props.feature } : undefined,
      },
      tags: {
        errorBoundary: true,
        feature: this.props.feature || 'unknown',
      },
    });

    this.setState({ errorId });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset, this.state.errorId);
      }

      // Default fallback UI
      const featureName = this.props.feature || 'component';

      return (
        <Card className="border-red-200 bg-red-50 m-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-red-900 mb-1">
                  {this.props.isolate ? `Error in ${featureName}` : 'Something went wrong'}
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  {this.props.isolate
                    ? `There was an issue loading this ${featureName}. Other parts of the application should continue to work normally.`
                    : 'We encountered an unexpected error. Please try again or contact support if the problem persists.'
                  }
                </p>

                {/* Development error details */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mb-3">
                    <summary className="cursor-pointer text-xs text-red-700 hover:text-red-900">
                      Debug Info
                    </summary>
                    <pre className="mt-1 text-xs font-mono text-red-700 bg-red-50 p-2 rounded border overflow-auto">
                      {this.state.error.message}
                      {this.state.error.stack && '\n\n' + this.state.error.stack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={this.reset}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Try Again
                  </Button>

                  {this.state.errorId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700"
                      onClick={() => {
                        const subject = `Error Report - ${featureName}`;
                        const body = `Error ID: ${this.state.errorId}\nFeature: ${featureName}\nTime: ${new Date().toLocaleString()}`;
                        window.open(`mailto:team@have-foresight.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                      }}
                    >
                      <Bug className="h-3 w-3 mr-1" />
                      Report
                    </Button>
                  )}
                </div>

                {this.state.errorId && (
                  <p className="text-xs text-red-600 mt-2">
                    Error ID: <code className="font-mono">{this.state.errorId}</code>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Wrapper for isolated feature errors
export function FeatureErrorBoundary({
  children,
  feature,
  ...props
}: ErrorBoundaryProps & { feature: string }) {
  return (
    <ErrorBoundary isolate feature={feature} {...props}>
      {children}
    </ErrorBoundary>
  );
}

// Wrapper for silent error boundaries (just log, don't show UI)
export function SilentErrorBoundary({
  children,
  feature,
  onError,
  ...props
}: Readonly<ErrorBoundaryProps>) {
  return (
    <ErrorBoundary
      feature={feature}
      onError={onError}
      fallback={() => (
        <div className="text-muted-foreground text-sm p-2 text-center">
          Unable to load {feature || "component"}
        </div>
      )}
      {...props}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
