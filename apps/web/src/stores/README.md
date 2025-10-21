# Foresight CDSS Zustand Store Architecture

This directory contains a comprehensive Zustand-based state management system for the Foresight CDSS application. The architecture is designed to handle complex healthcare data relationships, real-time updates, caching, and multi-entity operations.

## Architecture Overview

### Store Structure

```
stores/
├── entities/           # Entity-specific stores
│   ├── patientStore.ts    # Patient and related data
│   ├── claimStore.ts      # Claims and claim-related data
│   ├── priorAuthStore.ts  # Prior authorization data
│   ├── paymentStore.ts    # Payment and financial data
│   ├── providerStore.ts   # Provider and encounter data
│   ├── payerStore.ts      # Payer and insurance data
│   └── adminStore.ts      # Administrative and team data
├── utils/             # Utility functions and managers
│   ├── storeUtils.ts      # Common utilities (pagination, sorting, filtering)
│   ├── realtimeManager.ts # Real-time subscription management
│   └── cacheManager.ts    # Data caching and optimization
├── mainStore.ts       # Combined store with global state
├── index.ts          # Main exports
└── README.md         # This file
```

### Key Features

1. **Entity-Specific Slices**: Each major database entity has its own store slice with full CRUD operations
2. **Real-time Updates**: Automatic synchronization with database changes using Supabase real-time
3. **Intelligent Caching**: Automatic data caching with TTL and invalidation strategies
4. **Bulk Operations**: Support for multi-entity selection and bulk operations
5. **Data Processing**: Built-in pagination, sorting, filtering, and searching utilities
6. **Type Safety**: Full TypeScript support with database type integration
7. **Performance Optimization**: Selective re-rendering and efficient state updates

## Usage Examples

### Basic Store Usage

```typescript
import { usePatientStore, useClaimStore } from '@/stores';

function PatientList() {
  const {
    patients,
    patientsLoading,
    fetchPatients,
    setSelectedPatient
  } = usePatientStore();

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return (
    <div>
      {
        patientsLoading ? (
          <div>Loading...</div>
  )
:
  (
    patients.map(patient => (
      <div key = { patient.id }
  onClick = {()
=>
  setSelectedPatient(patient)
}>
  {
    patient.first_name
  }
  {
    patient.last_name
  }
  </div>
))
)
}
  </div>
)
  ;
}
```

### Real-time Updates

```typescript
import { useRealtimeUpdates } from '@/stores';

function App() {
  // Enable real-time updates for all entities
  useRealtimeUpdates({
    patients: true,
    claims: true,
    priorAuths: true,
    payments: true,
    teams: true
  });

  return <YourAppComponent / >;
}
```

### Data Processing with Utilities

```typescript
import { useDataProcessing, usePatientStore } from '@/stores';

function PatientTable() {
  const { patients } = usePatientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const {
    data: processedPatients,
    pagination,
    sortState,
    sort,
    goToNextPage,
    goToPreviousPage
  } = useDataProcessing(patients, {
    filters,
    searchTerm,
    searchFields: ['first_name', 'last_name', 'email'],
    sortField: 'last_name',
    sortDirection: 'asc',
    pageSize: 20
  });

  return (
    <div>
      <input
        value = { searchTerm }
  onChange = {(e)
=>
  setSearchTerm(e.target.value)
}
  placeholder = "Search patients..."
  / >

  <table>
    <thead>
      <tr>
        <th onClick = {()
=>
  sort('first_name')
}>
  First
  Name
  {
    sortState.field === 'first_name' && sortState.direction
  }
  </th>
  < th
  onClick = {()
=>
  sort('last_name')
}>
  Last
  Name
  {
    sortState.field === 'last_name' && sortState.direction
  }
  </th>
  < /tr>
  < /thead>
  < tbody >
  {
    processedPatients.map(patient => (
      <tr key = { patient.id } >
        <td>{ patient.first_name } < /td>
        < td > { patient.last_name } < /td>
        < /tr>
    ))
  }
  < /tbody>
  < /table>

  < div >
  Page
  {
    pagination.page
  }
  of
  {
    pagination.totalPages
  }
  <button onClick = { goToPreviousPage }
  disabled = { pagination.page === 1 } >
    Previous
    < /button>
    < button
  onClick = { goToNextPage }
  disabled = { pagination.page === pagination.totalPages } >
    Next
    < /button>
    < /div>
    < /div>
)
  ;
}
```

### Caching with Patient Data

```typescript
import { usePatientCache } from '@/stores';

function PatientDetail({ patientId }: { patientId: number }) {
  const {
    profile,
    diagnoses,
    documents,
    loading,
    refetch
  } = usePatientCache(patientId);

  return (
    <div>
      {
        loading.profile ? (
          <div>Loading profile...</div>
  )
:
  (
    <div>
      <h2>Patient
  Profile < /h2>
  {/* Profile data */
  }
  </div>
)
}

  {
    loading.diagnoses ? (
      <div>Loading diagnoses
  ...
    </div>
  ) :
    (
      <div>
        <h3>Diagnoses < /h3>
    {/* Diagnoses data */
    }
    </div>
  )
  }

  <button onClick = { refetch.all } >
    Refresh
  All
  Data
  < /button>
  < /div>
)
  ;
}
```

### Bulk Operations

```typescript
import { useBulkOperations, usePatientStore } from '@/stores';

function PatientManagement() {
  const { patients } = usePatientStore();
  const {
    bulkOperationMode,
    selectedEntityIds,
    setBulkOperationMode,
    toggleEntitySelection,
    executeBulkOperation,
    setBulkOperationType
  } = useBulkOperations();

  const handleBulkDelete = async () => {
    setBulkOperationType('delete');
    await executeBulkOperation();
  };

  return (
    <div>
      <button onClick = {()
=>
  setBulkOperationMode(!bulkOperationMode)
}>
  {
    bulkOperationMode ? 'Exit Bulk Mode' : 'Enter Bulk Mode'
  }
  </button>

  {
    bulkOperationMode && (
      <div>
        <button onClick = { handleBulkDelete }
    disabled = { selectedEntityIds.size === 0 } >
      Delete
    Selected({ selectedEntityIds.size })
    < /button>
    < /div>
  )
  }

  {
    patients.map(patient => (
      <div key = { patient.id } >
        { bulkOperationMode && (
          <input
            type =\"checkbox\"
    checked = { selectedEntityIds.has(patient.id) }
    onChange = {()
  =>
    toggleEntitySelection(patient.id)
  }
    />
  )
  }
    {
      patient.first_name
    }
    {
      patient.last_name
    }
    </div>
  ))
  }
  </div>
)
  ;
}
```

## Entity Stores

### PatientStore

Manages patient data and related information:

- Patient profiles
- Patient diagnoses
- Patient documents
- Patient payments
- Medical history
- Addresses
- Pharmacies
- Quality measures

### ClaimStore

Handles claims and claim-related data:

- Claims
- Claim lines
- Claim attachments
- Claim validations
- Claim state history
- Scrubber results
- Denial tracking

### PriorAuthStore

Manages prior authorization workflows:

- Prior authorizations
- Clinical criteria
- Requirement rules
- Supporting documents

### PaymentStore

Handles financial data:

- Payment details
- Payment adjustments
- Payment plans
- Payment posting sessions
- Payment reconciliations
- Payment variances
- Credit balances
- Remittance advice
- ERA line details

### ProviderStore

Manages provider and clinical data:

- Clinicians
- Provider credentialing
- Provider enrollment
- Provider schedules
- Service locations
- Encounters
- Appointments
- Referrals

### PayerStore

Handles payer and insurance data:

- Payers
- Payer configurations
- Portal credentials
- Response messages
- Submission configurations
- Insurance policies
- Benefits coverage
- Eligibility checks
- Drug formulary
- Fee schedules

### AdminStore

Manages administrative data:

- Teams
- Team members
- Team invitations
- Team settings
- User profiles
- User sessions
- System settings
- API keys
- Audit logs
- Security logs
- PHI export logs

## Utilities

### Store Utils

- **Pagination**: Automatic pagination with configurable page sizes
- **Sorting**: Multi-field sorting with direction control
- **Filtering**: Dynamic filtering with multiple criteria
- **Searching**: Full-text search across multiple fields
- **Data Processing**: Combined processing pipeline
- **Validation**: Entity validation functions
- **Relationships**: Entity relationship utilities

### Realtime Manager

- **Automatic Subscriptions**: Real-time database synchronization
- **Connection Management**: Connection status monitoring
- **Filtered Updates**: Entity-specific real-time updates
- **Reconnection Logic**: Automatic reconnection handling

### Cache Manager

- **Intelligent Caching**: TTL-based caching with automatic cleanup
- **Pattern Invalidation**: Bulk cache invalidation by patterns
- **Entity-Specific Caching**: Optimized caching for specific entities
- **Cache Statistics**: Monitoring and analytics

## Best Practices

### 1. Use Selective Stores

Import only the store slices you need to minimize re-renders:

```typescript
// Good
import { usePatientStore } from '@/stores';

// Avoid
import { useAppStore } from '@/stores';
```

### 2. Leverage Real-time Updates

Enable real-time updates for data that changes frequently:

```typescript
useRealtimeUpdates({
  patients: true,  // If patient data changes often
  claims: false,   // If claims are mostly read-only in your view
});
```

### 3. Use Caching for Expensive Operations

Cache data that's expensive to fetch or compute:

```typescript
const { data, loading } = useEntityCache(
  'patient_summary',
  patientId,
  () => fetchExpensivePatientSummary(patientId),
  { ttl: 10 * 60 * 1000 } // 10 minutes
);
```

### 4. Implement Proper Error Handling

Always handle loading and error states:

```typescript
const { patients, patientsLoading, patientsError } = usePatientStore();

if (patientsError) {
  return <ErrorMessage error = { patientsError }
  />;
}

if (patientsLoading) {
  return <LoadingSpinner / >;
}
```

### 5. Use Bulk Operations for Performance

When working with multiple entities, use bulk operations:

```typescript
// Instead of individual updates
patients.forEach(patient => updatePatient(patient.id, updates));

// Use bulk operations
setBulkOperationType('update');
selectAllEntities(patientIds);
await executeBulkOperation();
```

## Performance Considerations

1. **Selective Subscriptions**: Only subscribe to real-time updates for data you need
2. **Cache Management**: Set appropriate TTL values based on data volatility
3. **Pagination**: Always use pagination for large datasets
4. **Debounced Search**: Debounce search inputs to reduce API calls
5. **Memoization**: Use React.memo and useMemo for expensive computations

## Migration from Legacy Stores

The new store system is designed to be backward compatible. Existing stores are still available:

```typescript
// Legacy stores (still available)
import { useWorkflowStore, useUIStore } from '@/stores';

// New unified approach
import { useAppStore } from '@/stores';
```

## Contributing

When adding new entities or features:

1. Create entity-specific slices in `entities/` directory
2. Add utility functions to `utils/` if reusable
3. Update the main store to include new slices
4. Add appropriate TypeScript types
5. Include real-time subscription logic
6. Add caching strategies for new data
7. Update this README with usage examples

## Debugging

Enable devtools in development:

```typescript
// In config.ts
export const ENABLE_DEVTOOLS = process.env.NODE_ENV === 'development';
```

Use the Redux DevTools browser extension to inspect Zustand store state and actions. Zustand integrates seamlessly with Redux DevTools when the `devtools` middleware is enabled.
