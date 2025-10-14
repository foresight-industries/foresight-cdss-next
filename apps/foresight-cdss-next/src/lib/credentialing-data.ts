// Type definition for credentialing items
export interface CredentialingItem {
  id: number;
  state: string;
  payer: string;
  status: string;
  next: string;
  contact: string;
}

export interface CredentialingData {
  credentialingItems: CredentialingItem[];
  filterOptions: {
    stateOptions: Array<{ value: string; label: string }>;
    statusOptions: Array<{ value: string; label: string }>;
    payerOptions: Array<{ value: string; label: string }>;
    contactOptions: Array<{ value: string; label: string }>;
  };
}

// Initial credentialing data based on the HTML example
const initialCredentialingData: CredentialingItem[] = [
  { id: 1, state: 'MI', payer: 'Meridian', status: 'Active', next: '—', contact: 'portal' },
  { id: 2, state: 'MI', payer: 'Molina', status: 'Active', next: '—', contact: 'portal' },
  { id: 3, state: 'OH', payer: 'CareSource', status: 'In Progress', next: 'Awaiting CAQH attestation', contact: 'rep: cs-at-oh' },
  { id: 4, state: 'KY', payer: 'Anthem', status: 'Requested', next: 'Submit roster', contact: 'email' },
  { id: 5, state: 'TX', payer: 'Superior', status: 'Active', next: 'Add new site', contact: 'portal' },
  { id: 6, state: 'AZ', payer: 'AZ Complete Health', status: 'Planned', next: 'Start app', contact: '—' },
  { id: 7, state: 'FL', payer: 'Sunshine', status: 'In Progress', next: 'Taxonomy update', contact: 'portal' },
  { id: 8, state: 'IN', payer: 'MDwise', status: 'Planned', next: 'Credential NPs', contact: 'rep: mdw-in' }
];

// Filter options
const states = ['MI', 'OH', 'KY', 'TX', 'AZ', 'FL', 'IN'];
const statuses = ['Active', 'In Progress', 'Requested', 'Planned'];
const payers = ['Meridian', 'Molina', 'CareSource', 'Anthem', 'Superior', 'AZ Complete Health', 'Sunshine', 'MDwise'];

export async function getCredentialingData(): Promise<CredentialingData> {
  // In production, this would be actual database queries
  const credentialingItems = initialCredentialingData;
  
  // Create filter options
  const stateOptions = states.map(state => ({ value: state, label: state }));
  const statusOptions = statuses.map(status => ({ value: status, label: status }));
  const payerOptions = payers.map(payer => ({ value: payer, label: payer }));
  const contactOptions = [
    { value: 'portal', label: 'Portal' },
    { value: 'email', label: 'Email' },
    { value: 'rep', label: 'Representative' }
  ];

  const filterOptions = {
    stateOptions,
    statusOptions,
    payerOptions,
    contactOptions
  };

  return {
    credentialingItems,
    filterOptions,
  };
}