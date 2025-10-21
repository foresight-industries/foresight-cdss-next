# Error Boundaries

This directory contains reusable error boundary components for different parts of the application.

## Components

### `ErrorBoundary` (Base Component)
The main error boundary component with Sentry integration.

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary feature="my-feature">
  <MyComponent />
</ErrorBoundary>
```

### `FeatureErrorBoundary`
For isolating feature errors without breaking the entire page.

```tsx
import { FeatureErrorBoundary } from '@/components/error-boundaries';

<FeatureErrorBoundary feature="claims-processing">
  <ClaimsTable />
</FeatureErrorBoundary>
```

### `QueryErrorBoundary`
Specialized for data fetching errors.

```tsx
import { QueryErrorBoundary } from '@/components/error-boundaries';

<QueryErrorBoundary queryName="patient data" onRetry={refetch}>
  <PatientList />
</QueryErrorBoundary>
```

### `FormErrorBoundary`
For form components with unsaved data warnings.

```tsx
import { FormErrorBoundary } from '@/components/error-boundaries';

<FormErrorBoundary 
  formName="patient intake" 
  hasUnsavedData={isDirty}
  onRestore={restoreFormData}
>
  <PatientIntakeForm />
</FormErrorBoundary>
```

### `ChartErrorBoundary`
Silent error boundary for charts/visualizations.

```tsx
import { ChartErrorBoundary } from '@/components/error-boundaries';

<ChartErrorBoundary chartName="revenue chart" height={300} onRetry={refetchData}>
  <RevenueChart />
</ChartErrorBoundary>
```

### `TableErrorBoundary`
For data tables with export options.

```tsx
import { TableErrorBoundary } from '@/components/error-boundaries';

<TableErrorBoundary 
  tableName="claims data"
  onRetry={refetch}
  onExport={exportToCsv}
  showExport
>
  <ClaimsTable />
</TableErrorBoundary>
```

## Features

- **Sentry Integration**: Automatically logs errors with context
- **Development Mode**: Shows detailed error information in dev
- **Custom Fallbacks**: Each boundary can have custom error UI
- **Error Recovery**: Built-in retry functionality
- **Feature Isolation**: Prevents errors from breaking entire pages
- **Error IDs**: Trackable error references for support

## Usage Guidelines

1. **Wrap Features**: Use `FeatureErrorBoundary` around major features
2. **Data Components**: Use `QueryErrorBoundary` for data-fetching components  
3. **Forms**: Use `FormErrorBoundary` for any form with user input
4. **Charts/Graphs**: Use `ChartErrorBoundary` for visualizations
5. **Tables**: Use `TableErrorBoundary` for data tables
6. **Custom Cases**: Use base `ErrorBoundary` with custom fallback

## Error Reporting

All errors are automatically:
- Logged to Sentry with context
- Given unique error IDs for tracking
- Enhanced with feature/component information
- Available for user reporting via email