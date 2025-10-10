'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Filter, X, Clock, User, Database, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { allDetailedAuditEntries, type DetailedAuditEntry } from '@/data/audit-trail';

interface AuditFilters {
  search: string;
  entityType: string;
  operation: string;
  severity: string;
  actor: string;
  dateFrom: string;
  dateTo: string;
  tableName: string;
}

const ENTITY_TYPE_OPTIONS = [
  { value: 'all', label: 'All Entity Types' },
  { value: 'claims', label: 'Claims' },
  { value: 'epa', label: 'ePA Requests' },
  { value: 'patients', label: 'Patients' },
  { value: 'payments', label: 'Payments' },
  { value: 'configuration', label: 'Configuration' },
  { value: 'users', label: 'Users' },
];

const OPERATION_OPTIONS = [
  { value: 'all', label: 'All Operations' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'deny', label: 'Deny' },
  { value: 'resubmit', label: 'Resubmit' },
  { value: 'review', label: 'Review' },
  { value: 'sync', label: 'Sync' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

const getSeverityIcon = (severity: DetailedAuditEntry['severity']) => {
  switch (severity) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
};

const getSeverityBadgeVariant = (severity: DetailedAuditEntry['severity']) => {
  switch (severity) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export default function AuditTrailPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    entityType: 'all',
    operation: 'all',
    severity: 'all',
    actor: 'all',
    dateFrom: '',
    dateTo: '',
    tableName: 'all',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  // Get unique actors for filter dropdown
  const uniqueActors = useMemo(() => {
    const actors = [...new Set(allDetailedAuditEntries.map(entry => entry.actor).filter((actor): actor is string => Boolean(actor)))];
    return actors.sort();
  }, []);

  // Get unique table names for filter dropdown
  const uniqueTableNames = useMemo(() => {
    const tables = [...new Set(allDetailedAuditEntries.map(entry => entry.tableName))];
    return tables.sort();
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.search.trim() !== '' ||
      filters.entityType !== 'all' ||
      filters.operation !== 'all' ||
      filters.severity !== 'all' ||
      filters.actor !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filters.tableName !== 'all'
    );
  }, [filters]);

  const filteredEntries = useMemo(() => {
    return allDetailedAuditEntries.filter((entry) => {
      // Search filter
      if (filters.search.trim()) {
        const term = filters.search.trim().toLowerCase();
        const searchableText = [
          entry.message,
          entry.actor || '',
          entry.recordId || '',
          entry.operation,
          entry.tableName,
        ].join(' ').toLowerCase();

        if (!searchableText.includes(term)) {
          return false;
        }
      }

      // Entity type filter
      if (filters.entityType !== 'all' && entry.entityType !== filters.entityType) {
        return false;
      }

      // Operation filter
      if (filters.operation !== 'all' && entry.operation !== filters.operation) {
        return false;
      }

      // Severity filter
      if (filters.severity !== 'all' && entry.severity !== filters.severity) {
        return false;
      }

      // Actor filter
      if (filters.actor !== 'all' && entry.actor !== filters.actor) {
        return false;
      }

      // Table name filter
      if (filters.tableName !== 'all' && entry.tableName !== filters.tableName) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const entryDate = entry.rawTimestamp;

        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (entryDate < fromDate) {
            return false;
          }
        }

        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (entryDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [filters]);

  const visibleEntries = useMemo(() => {
    return filteredEntries.slice(0, visibleCount);
  }, [filteredEntries, visibleCount]);

  const loadMore = useCallback(() => {
    if (visibleCount >= filteredEntries.length) return;

    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 50, filteredEntries.length));
      setIsLoading(false);
    }, 200);
  }, [visibleCount, filteredEntries.length]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 &&
        !isLoading &&
        visibleCount < filteredEntries.length
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoading, visibleCount, filteredEntries.length]);

  const clearAllFilters = () => {
    setFilters({
      search: '',
      entityType: 'all',
      operation: 'all',
      severity: 'all',
      actor: 'all',
      dateFrom: '',
      dateTo: '',
      tableName: 'all',
    });
    setVisibleCount(50);
  };

  return (
    <div className="space-y-6 p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Audit Trail</h1>
        <p className="text-muted-foreground">
          Comprehensive log of all system activities and user actions
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total entries: {allDetailedAuditEntries.length.toLocaleString()}</span>
          <span>Filtered: {filteredEntries.length.toLocaleString()}</span>
          <span>Showing: {visibleEntries.length.toLocaleString()}</span>
        </div>
      </header>

      {/* Search and Filters */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-4 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search activities, actors, record IDs, operations..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
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
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {Object.values(filters).filter(v => v && v !== 'all').length}
                    </Badge>
                  )}
                </Button>

                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
                {filters.search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {filters.search}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.entityType !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Entity: {ENTITY_TYPE_OPTIONS.find(opt => opt.value === filters.entityType)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, entityType: 'all' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.operation !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Operation: {OPERATION_OPTIONS.find(opt => opt.value === filters.operation)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, operation: 'all' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.severity !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Severity: {SEVERITY_OPTIONS.find(opt => opt.value === filters.severity)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, severity: 'all' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.actor !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Actor: {filters.actor}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, actor: 'all' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.tableName !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Table: {filters.tableName}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, tableName: 'all' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <Badge variant="secondary" className="gap-1">
                    Date: {filters.dateFrom || '...'} to {filters.dateTo || '...'}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground mb-3">Quick Filters</div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity-select">Entity Type</Label>
                    <Select
                      value={filters.entityType}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value }))}
                    >
                      <SelectTrigger id="entity-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operation-select">Operation</Label>
                    <Select
                      value={filters.operation}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, operation: value }))}
                    >
                      <SelectTrigger id="operation-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATION_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity-select">Severity</Label>
                    <Select
                      value={filters.severity}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
                    >
                      <SelectTrigger id="severity-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actor-select">Actor</Label>
                    <Select
                      value={filters.actor}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, actor: value }))}
                    >
                      <SelectTrigger id="actor-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actors</SelectItem>
                        {uniqueActors.map(actor => (
                          <SelectItem key={actor} value={actor}>
                            {actor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="table-select">Table</Label>
                    <Select
                      value={filters.tableName}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, tableName: value }))}
                    >
                      <SelectTrigger id="table-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tables</SelectItem>
                        {uniqueTableNames.map(table => (
                          <SelectItem key={table} value={table}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail Entries */}
      <Card className="border shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {visibleEntries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No audit entries found matching your filters.</p>
                {hasActiveFilters() && (
                  <Button variant="outline" onClick={clearAllFilters} className="mt-2">
                    Clear filters to see all entries
                  </Button>
                )}
              </div>
            ) : (
              visibleEntries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(entry.severity)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-1">
                            {entry.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {entry.actor && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {entry.actor}
                              </span>
                            )}

                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {entry.timestamp}
                            </span>

                            {entry.recordId && (
                              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                {entry.recordId}
                              </span>
                            )}

                            {entry.duration && (
                              <span className="text-xs">
                                {entry.duration}ms
                              </span>
                            )}

                            {entry.ipAddress && (
                              <span className="text-xs">
                                {entry.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={cn("text-xs", getSeverityBadgeVariant(entry.severity))}>
                            {entry.severity}
                          </Badge>

                          <Badge variant="outline" className="text-xs">
                            {entry.operation}
                          </Badge>

                          <Badge variant="outline" className="text-xs">
                            {entry.tableName}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="p-4 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Loading more entries...
                </div>
              </div>
            )}

            {/* Load more manually if needed */}
            {!isLoading && visibleCount < filteredEntries.length && (
              <div className="p-4 text-center">
                <Button variant="outline" onClick={loadMore}>
                  Load More ({filteredEntries.length - visibleCount} remaining)
                </Button>
              </div>
            )}

            {/* End of results */}
            {visibleCount >= filteredEntries.length && filteredEntries.length > 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                All {filteredEntries.length.toLocaleString()} entries loaded
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
