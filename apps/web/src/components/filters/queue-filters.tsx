'use client';

import { DataFilters } from './data-filters';
import { QueueFilters as QueueFiltersType, createQueueFilterSections, getQueueFilterDisplayValue, getQueueFilterLabel } from './filter-configs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

  // Custom render function for the toggle switch
  const renderCustomFilters = () => (
    <div className="flex items-center gap-3">
      <Switch
        id="only-review-pa"
        checked={filters.onlyNeedsReview}
        onCheckedChange={(checked) => {
          const newFilters = {
            ...filters,
            onlyNeedsReview: checked === true,
          };
          onFiltersChange(newFilters);
        }}
        disabled={disabled}
      />
      <Label
        htmlFor="only-review-pa"
        className="mt-2 text-sm leading-none self-center"
      >
        Only show prior auths needing review
      </Label>
    </div>
  );

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
      customFilters={renderCustomFilters()}
    />
  );
}
