import { FilterSection } from './data-filters';

// Claims Filter Configuration - matches existing interface from data/claims.ts
export interface ClaimFilters {
  search: string;
  status: string; // StatusFilterValue type
  paStatuses: string[]; // PAStatus[]
  payer: string;
  state: string;
  visit: string;
  dateFrom: string;
  dateTo: string;
  onlyNeedsReview: boolean;
  // Column-specific filters
  claimId: string;
  patientName: string;
  payerName: string;
  provider: string;
  visitType: string;
  claimState: string;
}

export const createClaimsFilterSections = (
  statusOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>,
  paStatusOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>,
  payerOptions: Array<{ value: string; label: string }>,
  stateOptions: Array<{ value: string; label: string }>,
  visitOptions: Array<{ value: string; label: string }>
): FilterSection[] => [
  {
    title: "Quick Filters",
    gridCols: "grid-cols-1 md:grid-cols-3",
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOptions
      },
      {
        key: 'payer',
        label: 'Payer',
        type: 'select',
        options: payerOptions
      },
      {
        key: 'state',
        label: 'State',
        type: 'select',
        options: stateOptions
      }
    ]
  },
  {
    title: "",
    gridCols: "grid-cols-1 md:grid-cols-3",
    filters: [
      {
        key: 'visit',
        label: 'Visit Type',
        type: 'select',
        options: visitOptions
      },
      {
        key: 'dateFrom',
        label: 'From Date',
        type: 'date',
        placeholder: 'Select start date'
      },
      {
        key: 'dateTo',
        label: 'To Date',
        type: 'date',
        placeholder: 'Select end date'
      }
    ]
  }
];

// Pre-Encounters Filter Configuration
export interface PreEncounterFilters {
  search: string;
  status: string;
  priority: string;
  issueType: string;
  payer: string;
  dateFrom: string;
  dateTo: string;
}

export const createPreEncounterFilterSections = (
  statusOptions: Array<{ value: string; label: string }>,
  priorityOptions: Array<{ value: string; label: string }>,
  issueTypeOptions: Array<{ value: string; label: string }>,
  payerOptions: Array<{ value: string; label: string }>
): FilterSection[] => [
  {
    title: "Quick Filters",
    gridCols: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOptions
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: priorityOptions
      },
      {
        key: 'issueType',
        label: 'Issue Type',
        type: 'select',
        options: issueTypeOptions
      },
      {
        key: 'payer',
        label: 'Payer',
        type: 'select',
        options: payerOptions
      }
    ]
  },
  {
    title: "Date Range",
    gridCols: "grid-cols-1 md:grid-cols-2",
    filters: [
      {
        key: 'dateFrom',
        label: 'From Date',
        type: 'date',
        placeholder: 'Select start date'
      },
      {
        key: 'dateTo',
        label: 'To Date',
        type: 'date',
        placeholder: 'Select end date'
      }
    ]
  }
];

// Queue (PA) Filter Configuration  
export interface QueueFilters {
  search: string;
  status: string;
  priority: string;
  payer: string;
  dateFrom: string;
  dateTo: string;
  // Column-specific filters
  patientName: string;
  paId: string;
  medication: string;
  conditions: string;
  attempt: string;
}

export const createQueueFilterSections = (
  statusOptions: Array<{ value: string; label: string }>,
  priorityOptions: Array<{ value: string; label: string }>,
  payerOptions: Array<{ value: string; label: string }>
): FilterSection[] => [
  {
    title: "Quick Filters",
    gridCols: "grid-cols-1 md:grid-cols-3",
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOptions
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: priorityOptions
      },
      {
        key: 'payer',
        label: 'Payer',
        type: 'select',
        options: payerOptions
      }
    ]
  },
  {
    title: "Date Range",
    gridCols: "grid-cols-1 md:grid-cols-2",
    filters: [
      {
        key: 'dateFrom',
        label: 'From Date',
        type: 'date',
        placeholder: 'Select start date'
      },
      {
        key: 'dateTo',
        label: 'To Date',
        type: 'date',
        placeholder: 'Select end date'
      }
    ]
  }
];

// Helper functions for filter display
export const getClaimsFilterDisplayValue = (key: string, value: any, statusOptions?: ReadonlyArray<{ readonly value: string; readonly label: string }>, payerOptions?: any[]): string | null => {
  switch (key) {
    case 'status':
      return statusOptions?.find(opt => opt.value === value)?.label || value;
    case 'payer':
      return payerOptions?.find(p => String(p.id) === value)?.name || value;
    case 'paStatuses':
      if (Array.isArray(value) && value.length > 0) {
        return value.length === 1 ? value[0] : `${value.length} selected`;
      }
      return null;
    default:
      return null;
  }
};

export const getClaimsFilterLabel = (key: string): string => {
  const labels: { [key: string]: string } = {
    status: 'Status',
    paStatuses: 'PA Status',
    payer: 'Payer',
    state: 'State',
    visit: 'Visit',
    onlyNeedsReview: 'Only Needs Review',
    claimId: 'Claim ID',
    patientName: 'Patient',
    payerName: 'Payer Name',
    provider: 'Provider',
    visitType: 'Visit Type',
    claimState: 'State'
  };
  return labels[key] || key;
};

export const getPreEncounterFilterDisplayValue = (key: string, value: any, payerOptions?: any[]): string | null => {
  switch (key) {
    case 'status':
      return value.replace('_', ' ');
    case 'payer':
      return payerOptions?.find(p => p.name === value)?.name || value;
    default:
      return null;
  }
};

export const getPreEncounterFilterLabel = (key: string): string => {
  const labels: { [key: string]: string } = {
    status: 'Status',
    priority: 'Priority',
    issueType: 'Type',
    payer: 'Payer'
  };
  return labels[key] || key;
};

export const getQueueFilterDisplayValue = (key: string, value: any, payerOptions?: any[]): string | null => {
  switch (key) {
    case 'status':
      return value.replace('-', ' ');
    case 'payer':
      return payerOptions?.find(p => p.name === value)?.name || value;
    default:
      return null;
  }
};

export const getQueueFilterLabel = (key: string): string => {
  const labels: { [key: string]: string } = {
    status: 'Status',
    priority: 'Priority',
    payer: 'Payer',
    patientName: 'Patient',
    paId: 'PA ID',
    medication: 'Medication',
    conditions: 'Condition',
    attempt: 'Attempt'
  };
  return labels[key] || key;
};

// Credentialing Filter Configuration
export interface CredentialingFilters {
  search: string;
  state: string;
  status: string;
  payer: string;
  contact: string;
  dateFrom: string;
  dateTo: string;
}

export const createCredentialingFilterSections = (
  stateOptions: Array<{ value: string; label: string }>,
  statusOptions: Array<{ value: string; label: string }>,
  payerOptions: Array<{ value: string; label: string }>,
  contactOptions: Array<{ value: string; label: string }>
): FilterSection[] => [
  {
    title: "Quick Filters",
    gridCols: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    filters: [
      {
        key: 'state',
        label: 'State',
        type: 'select',
        options: stateOptions
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOptions
      },
      {
        key: 'payer',
        label: 'Payer',
        type: 'select',
        options: payerOptions
      },
      {
        key: 'contact',
        label: 'Contact Method',
        type: 'select',
        options: contactOptions
      }
    ]
  },
  {
    title: "Date Range",
    gridCols: "grid-cols-1 md:grid-cols-2",
    filters: [
      {
        key: 'dateFrom',
        label: 'From Date',
        type: 'date',
        placeholder: 'Select start date'
      },
      {
        key: 'dateTo',
        label: 'To Date',
        type: 'date',
        placeholder: 'Select end date'
      }
    ]
  }
];

export const getCredentialingFilterDisplayValue = (key: string, value: any, payerOptions?: any[]): string | null => {
  switch (key) {
    case 'status':
      return value.replace(/([A-Z])/g, ' $1').trim(); // Convert camelCase to spaced
    case 'payer':
      return payerOptions?.find(p => p.value === value)?.label || value;
    case 'contact':
      switch (value) {
        case 'portal':
          return 'Portal';
        case 'email':
          return 'Email';
        case 'rep':
          return 'Representative';
        default:
          return value;
      }
    default:
      return null;
  }
};

export const getCredentialingFilterLabel = (key: string): string => {
  const labels: { [key: string]: string } = {
    state: 'State',
    status: 'Status',
    payer: 'Payer',
    contact: 'Contact Method'
  };
  return labels[key] || key;
};