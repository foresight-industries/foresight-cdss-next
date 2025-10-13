'use client';

import { type JSX, type ReactNode, useState } from "react";
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Base filter type that all filter implementations should extend
export interface BaseFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  [key: string]: any; // Allow additional custom filters
}

// Configuration for different filter types
export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'input' | 'date' | 'multiselect' | 'checkbox';
  placeholder?: string;
  options?: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  gridColumn?: string; // CSS grid column span
}

export interface FilterSection {
  title: string;
  filters: FilterConfig[];
  gridCols?: string; // CSS grid columns for this section
}

export interface DataFiltersProps<T extends BaseFilters> {
  // Core props
  filters: T;
  onFiltersChange: (filters: T) => void;

  // Search configuration
  searchPlaceholder?: string;

  // Filter configuration
  filterSections: FilterSection[];

  // Active filter display configuration
  getFilterDisplayValue?: (key: string, value: any) => string | null;
  getFilterLabel?: (key: string) => string;

  // Custom filters to render at the end
  customFilters?: ReactNode;

  // External active filters (not part of main filters object)
  externalActiveFilters?: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }>;

  // Additional props
  className?: string;
  disabled?: boolean;
}

export function DataFilters<T extends BaseFilters>({
  filters,
  onFiltersChange,
  searchPlaceholder = "Search...",
  filterSections,
  getFilterDisplayValue,
  getFilterLabel,
  customFilters,
  externalActiveFilters,
  className,
  disabled = false,
}: Readonly<DataFiltersProps<T>>) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof T, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = () => {
    const hasMainFilters = Object.entries(filters).some(([key, value]) => {
      if (key === "search") return value.trim() !== "";
      if (key === "dateFrom" || key === "dateTo") return value.trim() !== "";
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value === true;
      return (
        value !== "" && value !== "all" && value !== null && value !== undefined
      );
    });

    const hasExternalFilters = externalActiveFilters && externalActiveFilters.length > 0;

    return hasMainFilters || hasExternalFilters;
  };

  const getActiveFilterCount = () => {
    const mainFilterCount = Object.entries(filters).filter(([key, value]) => {
      if (key === "search") return value.trim() !== "";
      if (key === "dateFrom" || key === "dateTo") return value.trim() !== "";
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return value === true;
      return (
        value !== "" && value !== "all" && value !== null && value !== undefined
      );
    }).length;

    const externalFilterCount = externalActiveFilters ? externalActiveFilters.length : 0;

    return mainFilterCount + externalFilterCount;
  };

  const clearAllFilters = () => {
    const clearedFilters = Object.keys(filters).reduce((acc, key) => {
      if (key === "search" || key === "dateFrom" || key === "dateTo") {
        acc[key as keyof T] = "" as T[keyof T];
      } else if (Array.isArray(filters[key as keyof T])) {
        acc[key as keyof T] = [] as T[keyof T];
      } else if (typeof filters[key as keyof T] === "boolean") {
        acc[key as keyof T] = false as T[keyof T];
      } else if (key.includes("Id") || key.includes("Name") || key.includes("State") || key.includes("provider") ||
                 key === "medication" || key === "conditions" || key === "attempt") {
        // Column-specific filters should be cleared to empty string
        acc[key as keyof T] = "" as T[keyof T];
      } else {
        acc[key as keyof T] = "all" as T[keyof T];
      }
      return acc;
    }, {} as T);
    onFiltersChange(clearedFilters);

    // Also clear external filters
    if (externalActiveFilters && externalActiveFilters.length > 0) {
      for (const filter of externalActiveFilters) filter.onRemove();
    }
  };

  const removeFilter = (key: keyof T) => {
    if (key === "search" || key === "dateFrom" || key === "dateTo") {
      updateFilter(key, "" as T[keyof T]);
    } else if (Array.isArray(filters[key])) {
      updateFilter(key, [] as T[keyof T]);
    } else if (typeof filters[key] === "boolean") {
      updateFilter(key, false as T[keyof T]);
    } else if (String(key).includes("Id") || String(key).includes("Name") || String(key).includes("State") || String(key).includes("provider") ||
               key === "medication" || key === "conditions" || key === "attempt") {
      // Column-specific filters should be cleared to empty string
      updateFilter(key, "" as T[keyof T]);
    } else {
      updateFilter(key, "all" as T[keyof T]);
    }
  };

  const renderFilterControl = (filter: FilterConfig) => {
    const value = filters[filter.key as keyof T];

    switch (filter.type) {
      case "select":
        return (
          <Select
            value={String(value)}
            onValueChange={(newValue) =>
              updateFilter(filter.key as keyof T, newValue as T[keyof T])
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={filter.placeholder || `Select ${filter.label}`}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label.toLowerCase() === 'status' ? 'statuses' : filter.label.toLowerCase() === 'priority' ? 'priorities' : `${filter.label.toLowerCase()}s`}</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        // For multiselect, you might want to implement a custom component or use a library
        // For now, this is a simplified version
        return (
          <Select
            value={Array.isArray(value) && value.length > 0 ? String(value[0]) : "all"}
            onValueChange={(newValue) => {
              if (newValue === "all") {
                updateFilter(filter.key as keyof T, [] as T[keyof T]);
              } else {
                // Toggle selection for simplified multiselect
                const currentArray = Array.isArray(value) ? (value as string[]) : [];
                const newArray = currentArray.includes(newValue)
                  ? currentArray.filter((v) => v !== newValue)
                  : [...currentArray, newValue];
                updateFilter(filter.key as keyof T, newArray as T[keyof T]);
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={filter.placeholder || `Select ${filter.label}`}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label.toLowerCase() === 'status' ? 'statuses' : filter.label.toLowerCase() === 'priority' ? 'priorities' : `${filter.label.toLowerCase()}s`}</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "input":
        return (
          <Input
            placeholder={
              filter.placeholder || `Enter ${filter.label.toLowerCase()}...`
            }
            value={String(value || "")}
            onChange={(e) =>
              updateFilter(filter.key as keyof T, e.target.value as T[keyof T])
            }
            disabled={disabled}
          />
        );

      case "date": {
        const isFromDate = filter.key.includes("From");
        const isToDate = filter.key.includes("To");

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value
                  ? new Date(String(value)).toLocaleDateString()
                  : filter.placeholder || "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(String(value)) : undefined}
                onSelect={(date) => {
                  updateFilter(
                    filter.key as keyof T,
                    (date ? date.toISOString().split("T")[0] : "") as T[keyof T]
                  );
                }}
                disabled={(date) => {
                  if (isToDate && filters.dateFrom) {
                    return date < new Date(filters.dateFrom);
                  }
                  if (isFromDate && filters.dateTo) {
                    return date > new Date(filters.dateTo);
                  }
                  return false;
                }}
              />
            </PopoverContent>
          </Popover>
        );
      }

      default:
        return null;
    }
  };

  const getActiveFilterBadges = () => {
    const badges: JSX.Element[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (key === "search" && value && String(value).trim() !== "") {
        badges.push(
          <Badge key={key} variant="secondary" className="gap-1">
            Search: {String(value)}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => removeFilter(key as keyof T)}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        );
      } else if (key === "dateFrom" || key === "dateTo") {
        // Handle date range as a combined badge
        if (key === "dateFrom" && (filters.dateFrom || filters.dateTo)) {
          badges.push(
            <Badge key="dateRange" variant="secondary" className="gap-1">
              Date: {filters.dateFrom || "..."} to {filters.dateTo || "..."}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => {
                  updateFilter("dateFrom" as keyof T, "" as T[keyof T]);
                  updateFilter("dateTo" as keyof T, "" as T[keyof T]);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          );
        }
      } else if (typeof value === "boolean" && value === true) {
        // Handle boolean filters when they are true
        const label = getFilterLabel ? getFilterLabel(key) : key;
        badges.push(
          <Badge key={key} variant="secondary" className="gap-1">
            {label}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => removeFilter(key as keyof T)}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        );
      } else if (
        value &&
        value !== "all" &&
        value !== "" &&
        value !== null &&
        value !== undefined &&
        typeof value !== "boolean" &&
        !(Array.isArray(value) && value.length === 0)
      ) {
        let displayValue = String(value);
        const label = getFilterLabel ? getFilterLabel(key) : key;

        if (getFilterDisplayValue) {
          const customDisplay = getFilterDisplayValue(key, value);
          if (customDisplay) displayValue = customDisplay;
        }

        if (Array.isArray(value) && value.length > 0) {
          displayValue =
            value.length === 1 ? String(value[0]) : `${value.length} selected`;
        }

        badges.push(
          <Badge key={key} variant="secondary" className="gap-1">
            {label}: {displayValue}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={() => removeFilter(key as keyof T)}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        );
      }
    }

    // Add external filter badges
    if (externalActiveFilters) {
      for (const filter of externalActiveFilters) {
        badges.push(
          <Badge key={filter.key} variant="secondary" className="gap-1">
            {filter.label}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1"
              onClick={filter.onRemove}
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        );
      }
    }

    return badges;
  };

  return (
    <Card className={cn("border shadow-xs", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search and Filter Toggle Row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={filters.search}
                onChange={(event) =>
                  updateFilter(
                    "search" as keyof T,
                    event.target.value as T[keyof T]
                  )
                }
                className="pl-10"
                disabled={disabled}
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "cursor-pointer",
                  showFilters && "bg-accent",
                  hasActiveFilters() && "border-primary text-primary"
                )}
                disabled={disabled}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters() && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>

              {hasActiveFilters() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  disabled={disabled}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-muted-foreground mr-2">
                Active filters:
              </span>
              {getActiveFilterBadges()}
            </div>
          )}

          {/* Filter Controls */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                {filterSections.map((section) => (
                  <div key={section.title} className="space-y-4">
                    {section.title && (
                      <div className="text-sm font-medium text-muted-foreground">
                        {section.title}
                      </div>
                    )}
                    <div
                      className={cn(
                        "grid gap-4",
                        section.gridCols ||
                          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      )}
                    >
                      {section.filters.map((filter) => (
                        <div
                          key={filter.key}
                          className={cn("space-y-2", filter.gridColumn)}
                        >
                          <Label htmlFor={`${filter.key}-filter`}>
                            {filter.label}
                          </Label>
                          {renderFilterControl(filter)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Custom Filters */}
                {customFilters && (
                  <div className="space-y-4">{customFilters}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
