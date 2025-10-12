'use client';

import { useState, useMemo } from 'react';
import { Filter, Download, MoreHorizontal, Clock, AlertCircle, CheckCircle, XCircle, Eye, Edit, FileText, MessageSquare, Archive, ChevronUp, ChevronDown, ArrowUpDown, X } from 'lucide-react';
import { type QueueFiltersType, QueueFilters } from '@/components/filters';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { epaQueueItems } from '@/data/epa-queue';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PADetails } from "@/components/pa/pa-details";

// Using shared QueueFilters type from filters component

type SortField = 'id' | 'patientName' | 'medication' | 'payer' | 'status' | 'updatedAt';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

const statusConfig = {
  'needs-review': { color: 'bg-yellow-50 text-yellow-900 border-yellow-200', icon: AlertCircle },
  'auto-processing': { color: 'bg-blue-50 text-blue-900 border-blue-200', icon: Clock },
  'auto-approved': { color: 'bg-green-50 text-green-900 border-green-200', icon: CheckCircle },
  'denied': { color: 'bg-red-50 text-red-900 border-red-200', icon: XCircle }
} as const;

const formatRelativeTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const diffMs = Date.now() - parsed.getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export default function QueuePage() {
  const router = useRouter();
  const [filters, setFilters] = useState<QueueFiltersType>({
    search: '',
    status: 'all',
    priority: 'all',
    payer: 'all',
    dateFrom: '',
    dateTo: '',
    patientName: '',
    paId: '',
    medication: '',
    conditions: '',
    attempt: ''
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null
  });
  const [selectedPaId, setSelectedPaId] = useState<string | null>(null);

  // Mock data for demonstration
  // Use shared mock data instead of API call
  const queueData = epaQueueItems;
  const isLoading = false;
  const error = null;

  const filteredData = useMemo(() => {
    const filtered = queueData.filter(item => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.medication.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.payer.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const matchesPayer = filters.payer === 'all' || item.payer === filters.payer;

      // Date filtering
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (new Date(item.updatedAt) < from) {
          return false;
        }
      }

      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        if (new Date(item.updatedAt) > to) {
          return false;
        }
      }

      // Column-specific filters
      const matchesPatientName = !filters.patientName || item.patientName.toLowerCase().includes(filters.patientName.toLowerCase());
      const matchesPaId = !filters.paId || item.id.toLowerCase().includes(filters.paId.toLowerCase());
      const matchesMedication = !filters.medication || item.medication.toLowerCase().includes(filters.medication.toLowerCase());
      const matchesConditions = !filters.conditions || item.conditions.toLowerCase().includes(filters.conditions.toLowerCase());
      const matchesAttempt = !filters.attempt || item.attempt.toLowerCase().includes(filters.attempt.toLowerCase());

      return matchesSearch && matchesStatus && matchesPayer &&
             matchesPatientName && matchesPaId && matchesMedication && matchesConditions && matchesAttempt;
    });

    // Apply sorting
    if (sortConfig.field && sortConfig.direction) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.field!];
        let bValue: any = b[sortConfig.field!];

        // Handle special cases
        if (sortConfig.field === 'updatedAt') {
          const parseTime = (value: string) => new Date(value).getTime();
          aValue = parseTime(a.updatedAt);
          bValue = parseTime(b.updatedAt);
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sorting: prioritize "needs-review" status first, then by updated date descending
      filtered.sort((a, b) => {
        // First priority: needs-review status should come first
        if (a.status === 'needs-review' && b.status !== 'needs-review') return -1;
        if (b.status === 'needs-review' && a.status !== 'needs-review') return 1;
        
        // Second priority: sort by updated date (newest first)
        const aTime = new Date(a.updatedAt).getTime();
        const bTime = new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
    }

    return filtered;
  }, [queueData, filters, sortConfig]);


  const handleAction = (action: string, paId: string) => {
    // Handle different actions
    switch (action) {
      case 'view':
        setSelectedPaId(paId);
        break;
      case 'edit':
        router.push(`/pa/${paId}?action=edit`);
        break;
      case 'documents':
        router.push(`/pa/${paId}?tab=documents`);
        break;
      case 'notes':
        router.push(`/pa/${paId}?action=note`);
        break;
      case 'archive':
        alert(`Archive PA ${paId} - This would archive the PA request`);
        break;
      default:
        break;
    }
  };

  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        // Cycle through: asc -> desc -> null
        if (prevConfig.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prevConfig.direction === 'desc') {
          return { field: null, direction: null };
        }
      }
      return { field, direction: 'asc' };
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-4 h-4 text-primary" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ChevronDown className="w-4 h-4 text-primary" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };


  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600">Error loading queue data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">PA Queue</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and review prior authorization requests
          </p>
        </header>
        <div className="flex gap-2">
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <QueueFilters
        filters={filters}
        onFiltersChange={setFilters}
        statusOptions={[
          { value: 'needs-review', label: 'Needs Review' },
          { value: 'auto-processing', label: 'Auto Processing' },
          { value: 'auto-approved', label: 'Auto Approved' },
          { value: 'denied', label: 'Denied' }
        ]}
        priorityOptions={[
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' }
        ]}
        payerOptions={[
          { value: 'Aetna', label: 'Aetna' },
          { value: 'UnitedHealth', label: 'UnitedHealth' },
          { value: 'Cigna', label: 'Cigna' },
          { value: 'Anthem', label: 'Anthem' }
        ]}
      />

      {/* Queue Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading queue...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span>PA Details</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleSort('id')}
                        >
                          {getSortIcon('id')}
                        </Button>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Filter className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="pa-filter">Filter by PA ID</Label>
                              <Input
                                id="pa-filter"
                                placeholder="Enter PA ID..."
                                value={filters.paId}
                                onChange={(e) => setFilters(prev => ({ ...prev, paId: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="attempt-filter">Filter by Attempt Type</Label>
                              <Input
                                id="attempt-filter"
                                placeholder="Enter attempt type..."
                                value={filters.attempt}
                                onChange={(e) => setFilters(prev => ({ ...prev, attempt: e.target.value }))}
                              />
                            </div>
                            {(filters.paId || filters.attempt) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilters(prev => ({ ...prev, paId: '', attempt: '' }))}
                                className="w-full"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Clear PA Filters
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span>Patient</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleSort('patientName')}
                        >
                          {getSortIcon('patientName')}
                        </Button>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Filter className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="patient-filter">Filter by Patient Name</Label>
                              <Input
                                id="patient-filter"
                                placeholder="Enter patient name..."
                                value={filters.patientName}
                                onChange={(e) => setFilters(prev => ({ ...prev, patientName: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="conditions-filter">Filter by Conditions</Label>
                              <Input
                                id="conditions-filter"
                                placeholder="Enter condition..."
                                value={filters.conditions}
                                onChange={(e) => setFilters(prev => ({ ...prev, conditions: e.target.value }))}
                              />
                            </div>
                            {(filters.patientName || filters.conditions) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilters(prev => ({ ...prev, patientName: '', conditions: '' }))}
                                className="w-full"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Clear Patient Filters
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span>Medication</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleSort('medication')}
                        >
                          {getSortIcon('medication')}
                        </Button>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Filter className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="medication-filter">Filter by Medication</Label>
                              <Input
                                id="medication-filter"
                                placeholder="Enter medication..."
                                value={filters.medication}
                                onChange={(e) => setFilters(prev => ({ ...prev, medication: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="payer-select-column">Filter by Payer</Label>
                              <Select value={filters.payer} onValueChange={(value) => setFilters(prev => ({ ...prev, payer: value as any }))}>
                                <SelectTrigger id="payer-select-column">
                                  <SelectValue placeholder="All Payers" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Payers</SelectItem>
                                  <SelectItem value="Aetna">Aetna</SelectItem>
                                  <SelectItem value="UnitedHealth">UnitedHealth</SelectItem>
                                  <SelectItem value="Cigna">Cigna</SelectItem>
                                  <SelectItem value="Anthem">Anthem</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {(filters.medication || filters.payer !== 'all') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilters(prev => ({ ...prev, medication: '', payer: 'all' }))}
                                className="w-full"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Clear Medication Filters
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleSort('status')}
                        >
                          {getSortIcon('status')}
                        </Button>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Filter className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60" align="start">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="status-select-column">Filter by Status</Label>
                              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}>
                                <SelectTrigger id="status-select-column">
                                  <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Statuses</SelectItem>
                                  <SelectItem value="needs-review">Needs Review</SelectItem>
                                  <SelectItem value="auto-processing">Auto Processing</SelectItem>
                                  <SelectItem value="auto-approved">Auto Approved</SelectItem>
                                  <SelectItem value="denied">Denied</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {filters.status !== 'all' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                                className="w-full"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Clear Status Filter
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span>Payer</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleSort('payer')}
                        >
                          {getSortIcon('payer')}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span>Updated</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSort('updatedAt')}
                      >
                        {getSortIcon('updatedAt')}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => {
                  const StatusIcon = statusConfig[item.status].icon;
                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedPaId(item.id)}
                    >
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary">
                            {item.id}
                          </div>
                          <div className="text-sm text-muted-foreground">{item.attempt}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.patientName}</div>
                          <div className="text-sm text-muted-foreground">{item.patientId}</div>
                          {item.conditions && (
                            <div className="text-xs text-muted-foreground mt-1">{item.conditions}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.medication}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center">
                          <StatusIcon className="w-4 h-4 mr-2" />
                          <Badge variant="outline" className={statusConfig[item.status].color}>
                            {item.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.payer}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {formatRelativeTime(item.updatedAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction('view', item.id);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction('edit', item.id);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit PA
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction('documents', item.id);
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction('notes', item.id);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Add Note
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction('archive', item.id);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {filteredData.length === 0 && !isLoading && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No prior authorization requests match your filters.</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setFilters({
                    search: '',
                    status: 'all',
                    priority: 'all',
                    payer: 'all',
                    dateFrom: '',
                    dateTo: '',
                    patientName: '',
                    paId: '',
                    medication: '',
                    conditions: '',
                    attempt: ''
                  });
                  setSortConfig({ field: null, direction: null });
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PA Details Sheet */}
      <Sheet
        open={Boolean(selectedPaId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaId(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full xs:min-w-[600px] lg:min-w-[600px] max-w-[80vw] xs:max-w-[80vw] lg:max-w-[45vw] flex flex-col p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Prior Authorization Details</SheetTitle>
          </SheetHeader>
          {selectedPaId && (
            <PADetails
              paId={selectedPaId}
              onClose={() => setSelectedPaId(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
