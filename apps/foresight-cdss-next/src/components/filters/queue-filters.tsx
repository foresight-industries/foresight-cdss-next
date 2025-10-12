'use client';

import { DataFilters } from './data-filters';
import { QueueFilters as QueueFiltersType, createQueueFilterSections, getQueueFilterDisplayValue, getQueueFilterLabel } from './filter-configs';

interface QueueFiltersProps {
  filters: QueueFiltersType;
  onFiltersChange: (filters: QueueFiltersType) => void;

  // Options for dropdowns
  statusOptions: Array<{ value: string; label: string }>;
  priorityOptions: Array<{ value: string; label: string }>;
  payerOptions: Array<{ value: string; label: string }>;

  className?: string;
  disabled?: boolean;
}

export function QueueFilters({
  filters,
  onFiltersChange,
  statusOptions,
  priorityOptions,
  payerOptions,
  className,
  disabled = false,
}: Readonly<QueueFiltersProps>) {

  const filterSections = createQueueFilterSections(
    statusOptions,
    priorityOptions,
    payerOptions
  );

  const customGetFilterDisplayValue = (key: string, value: any) => {
    return getQueueFilterDisplayValue(key, value, payerOptions);
  };

  return (
    <DataFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      searchPlaceholder="Search by patient, PA ID, medication, or payer..."
      filterSections={filterSections}
      getFilterDisplayValue={customGetFilterDisplayValue}
      getFilterLabel={getQueueFilterLabel}
      className={className}
      disabled={disabled}
    />
  );
}
