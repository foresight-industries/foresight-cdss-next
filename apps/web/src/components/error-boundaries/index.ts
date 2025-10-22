// Re-export the main ErrorBoundary components
export { default as ErrorBoundary, FeatureErrorBoundary, SilentErrorBoundary } from '../error-boundary';

// Export specialized wrappers
export { default as QueryErrorBoundary } from './query-error-boundary';
export { default as FormErrorBoundary } from './form-error-boundary';
export { default as ChartErrorBoundary } from './chart-error-boundary';
export { default as TableErrorBoundary } from './table-error-boundary';