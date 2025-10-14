'use client';

import { DataFilters } from './data-filters';
import { ClaimFilters, createClaimsFilterSections, getClaimsFilterDisplayValue, getClaimsFilterLabel } from './filter-configs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ClaimsFiltersProps {
  filters: ClaimFilters;
  onFiltersChange: (filters: ClaimFilters) => void;

  // Options for dropdowns
  statusOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  paStatusOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  payers: Array<{ id: number | string; name: string }>;
  states: string[];
  visitTypes: string[];

  // Dollar-first functionality
  dollarFirst: boolean;
  onDollarFirstChange: (enabled: boolean) => void;

  // Disable search and status filter overrides for dollar-first mode
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onPayerChange?: (value: string) => void;
  onStateChange?: (value: string) => void;
  onVisitChange?: (value: string) => void;
  onColumnFilterChange?: (key: string, value: string) => void;

  className?: string;
  disabled?: boolean;
}

export function ClaimsFilters({
  filters,
  onFiltersChange,
  statusOptions,
  paStatusOptions,
  payers,
  states,
  visitTypes,
  dollarFirst,
  onDollarFirstChange,
  onSearchChange,
  onStatusChange,
  onPayerChange,
  onStateChange,
  onVisitChange,
  onColumnFilterChange,
  className,
  disabled = false,
}: Readonly<ClaimsFiltersProps>) {
  // Convert payers array to the format expected by filter configs
  const payerOptions = payers.map((payer) => ({
    value: String(payer.id),
    label: payer.name,
  }));

  const stateOptions = states.map((state) => ({
    value: state,
    label: state,
  }));

  const visitOptions = visitTypes.map((visit) => ({
    value: visit,
    label: visit,
  }));

  const filterSections = createClaimsFilterSections(
    statusOptions,
    paStatusOptions,
    payerOptions,
    stateOptions,
    visitOptions
  );

  // Handle filter changes with dollar-first logic
  const handleFiltersChange = (newFilters: ClaimFilters) => {
    console.log('ClaimsFilters - handleFiltersChange called with:', newFilters);
    console.log('ClaimsFilters - current filters:', filters);
    
    // Check if any filter that should disable dollar-first is being set
    const shouldDisableDollarFirst =
      (newFilters.search.trim() !== "" &&
        newFilters.search !== filters.search) ||
      (newFilters.status !== "all" && newFilters.status !== filters.status) ||
      (newFilters.payer !== "all" && newFilters.payer !== filters.payer) ||
      (newFilters.state !== "all" && newFilters.state !== filters.state) ||
      (newFilters.visit !== "all" && newFilters.visit !== filters.visit) ||
      (newFilters.dateFrom.trim() !== "" &&
        newFilters.dateFrom !== filters.dateFrom) ||
      (newFilters.dateTo.trim() !== "" &&
        newFilters.dateTo !== filters.dateTo) ||
      newFilters.onlyNeedsReview !== filters.onlyNeedsReview;

    if (shouldDisableDollarFirst && dollarFirst) {
      onDollarFirstChange(false);
    }

    onFiltersChange(newFilters);

    // Call individual change handlers if provided (for backward compatibility)
    if (onSearchChange && newFilters.search !== filters.search) {
      onSearchChange(newFilters.search);
    }
    if (onStatusChange && newFilters.status !== filters.status) {
      onStatusChange(newFilters.status);
    }
    if (onPayerChange && newFilters.payer !== filters.payer) {
      onPayerChange(newFilters.payer);
    }
    if (onStateChange && newFilters.state !== filters.state) {
      onStateChange(newFilters.state);
    }
    if (onVisitChange && newFilters.visit !== filters.visit) {
      onVisitChange(newFilters.visit);
    }
  };

  const customGetFilterDisplayValue = (key: string, value: any) => {
    return getClaimsFilterDisplayValue(key, value, statusOptions, payers);
  };

  // Custom render function to add the toggles after the filter sections
  const renderCustomFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center gap-3">
        <Switch
          id="only-review"
          checked={filters.onlyNeedsReview}
          onCheckedChange={(checked) => {
            const newFilters = {
              ...filters,
              onlyNeedsReview: checked === true,
            };
            handleFiltersChange(newFilters);
          }}
          disabled={disabled}
        />
        <Label
          htmlFor="only-review"
          className="mt-2 text-sm leading-none self-center"
        >
          Only show claims needing review
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="dollar-first"
          checked={dollarFirst}
          onCheckedChange={(checked) => onDollarFirstChange(checked === true)}
          disabled={disabled}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Label
              htmlFor="dollar-first"
              className="mt-2 text-sm leading-none self-center cursor-pointer"
            >
              High $ first
            </Label>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <p>
              Sort claims by highest dollar amount first. Automatically turns
              off when using other filters.
            </p>
          </TooltipContent>
        </Tooltip>
        {dollarFirst && (
          <Badge variant="secondary" className="ml-2 text-xs">
            Active
          </Badge>
        )}
      </div>
    </div>
  );

  // Create external active filters for dollarFirst
  const externalActiveFilters = dollarFirst ? [
    {
      key: 'dollarFirst',
      label: 'High $ first',
      onRemove: () => onDollarFirstChange(false)
    }
  ] : undefined;

  return (
    <DataFilters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      searchPlaceholder="Search patients, claims, encounters, payers, codes..."
      filterSections={filterSections}
      getFilterDisplayValue={customGetFilterDisplayValue}
      getFilterLabel={getClaimsFilterLabel}
      className={className}
      disabled={disabled}
      customFilters={renderCustomFilters()}
      externalActiveFilters={externalActiveFilters}
    />
  );
}
