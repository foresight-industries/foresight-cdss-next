'use client';

import { DataFilters } from './data-filters';
import { PreEncounterFilters as PreEncounterFiltersType, createPreEncounterFilterSections, getPreEncounterFilterDisplayValue, getPreEncounterFilterLabel } from './filter-configs';

interface PreEncounterFiltersProps {
  filters: PreEncounterFiltersType;
  onFiltersChange: (filters: PreEncounterFiltersType) => void;

  // Options for dropdowns
  statusOptions: Array<{ value: string; label: string }>;
  priorityOptions: Array<{ value: string; label: string }>;
  issueTypeOptions: Array<{ value: string; label: string }>;
  payerOptions: Array<{ value: string; label: string }>;

  className?: string;
  disabled?: boolean;
}

export function PreEncounterFilters({
  filters,
  onFiltersChange,
  statusOptions,
  priorityOptions,
  issueTypeOptions,
  payerOptions,
  className,
  disabled = false,
}: Readonly<PreEncounterFiltersProps>) {
  
  const filterSections = createPreEncounterFilterSections(
    statusOptions,
    priorityOptions,
    issueTypeOptions,
    payerOptions
  );
  
  const customGetFilterDisplayValue = (key: string, value: any) => {
    return getPreEncounterFilterDisplayValue(key, value, payerOptions);
  };
  
  return (
    <DataFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      searchPlaceholder="Search patients, issues, payers..."
      filterSections={filterSections}
      getFilterDisplayValue={customGetFilterDisplayValue}
      getFilterLabel={getPreEncounterFilterLabel}
      className={className}
      disabled={disabled}
    />
  );
}