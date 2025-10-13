'use client';

import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { Filter, Download, MoreHorizontal, Clock, AlertCircle, CheckCircle, XCircle, Eye, Edit, FileText, MessageSquare, Archive, ChevronUp, ChevronDown, ArrowUpDown, X } from 'lucide-react';
import { type QueueFiltersType, QueueFilters } from '@/components/filters';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { QueueData } from '@/lib/queue-data';

// Lazy load heavy components
const PADetails = lazy(() => import('@/components/pa/pa-details').then(module => ({ default: module.PADetails })));

// Loading fallback
function ComponentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  );
}

type SortField = 'id' | 'patientName' | 'medication' | 'payer' | 'status' | 'updatedAt';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface QueueClientProps {
  data: QueueData;
}

export function QueueClient({ data }: QueueClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(data.items);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showPASheet, setShowPASheet] = useState(false);
  const [selectedPA, setSelectedPA] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'updatedAt',
    direction: 'desc'
  });

  // Filters state
  const [filters, setFilters] = useState<QueueFiltersType>({
    search: '',
    status: [],
    payer: [],
    medication: [],
    dateRange: undefined,
    priority: []
  });

  // Get unique filter values from server-computed data
  const filterOptions = useMemo(() => ({
    status: Object.keys(data.statusCounts),
    payer: Object.keys(data.payerCounts), 
    medication: Object.keys(data.medicationCounts)
  }), [data]);

  // Initialize filters from URL params
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlPayer = searchParams.get('payer');
    const urlSearch = searchParams.get('search');
    
    if (urlStatus || urlPayer || urlSearch) {
      setFilters(prev => ({
        ...prev,
        status: urlStatus ? [urlStatus] : [],
        payer: urlPayer ? [urlPayer] : [],
        search: urlSearch || ''
      }));
    }
  }, [searchParams]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.patientName.toLowerCase().includes(searchLower) ||
        item.medication.toLowerCase().includes(searchLower) ||
        item.payer.toLowerCase().includes(searchLower) ||
        item.id.toString().includes(searchLower)
      );
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(item => filters.status.includes(item.status));
    }

    if (filters.payer.length > 0) {
      filtered = filtered.filter(item => filters.payer.includes(item.payer));
    }

    if (filters.medication.length > 0) {
      filtered = filtered.filter(item => filters.medication.includes(item.medication));
    }

    // Apply sorting
    if (sortConfig.direction) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.field];
        let bVal = b[sortConfig.field];

        // Handle dates
        if (sortConfig.field === 'updatedAt') {
          aVal = new Date(aVal as string).getTime();
          bVal = new Date(bVal as string).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [items, filters, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === filteredAndSortedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAndSortedItems.map(item => item.id));
    }
  }, [selectedItems, filteredAndSortedItems]);

  const handleSelectItem = useCallback((id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  }, []);

  const handleViewPA = (item: any) => {
    setSelectedPA(item);
    setShowPASheet(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'needs-review':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'auto-processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'auto-approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'auto-denied':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'needs-review':
        return 'secondary';
      case 'auto-processing':
        return 'default';
      case 'auto-approved':
        return 'default';
      case 'auto-denied':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const activeFiltersCount = [
    ...filters.status,
    ...filters.payer,
    ...filters.medication,
    ...(filters.search ? [filters.search] : [])
  ].length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prior Authorization Queue</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and process prior authorization requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant={showFilters ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <QueueFilters
            filters={filters}
            onFiltersChange={setFilters}
            statusOptions={filterOptions.status}
            payerOptions={filterOptions.payer}
            medicationOptions={filterOptions.medication}
          />
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
            <p className="text-2xl font-bold">{data.totalItems}</p>
            <p className="text-xs text-gray-500">All PA requests</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Needs Review</p>
            <p className="text-2xl font-bold">{data.statusCounts['needs-review'] || 0}</p>
            <p className="text-xs text-gray-500">Manual review required</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto Processing</p>
            <p className="text-2xl font-bold">{data.statusCounts['auto-processing'] || 0}</p>
            <p className="text-xs text-gray-500">Being processed</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto Approved</p>
            <p className="text-2xl font-bold">{data.statusCounts['auto-approved'] || 0}</p>
            <p className="text-xs text-gray-500">Automatically approved</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search by patient, medication, or payer..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-64"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredAndSortedItems.length} of {data.totalItems} items
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-2">
                    ID
                    {getSortIcon('id')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('patientName')}
                >
                  <div className="flex items-center gap-2">
                    Patient
                    {getSortIcon('patientName')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('medication')}
                >
                  <div className="flex items-center gap-2">
                    Medication
                    {getSortIcon('medication')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('payer')}
                >
                  <div className="flex items-center gap-2">
                    Payer
                    {getSortIcon('payer')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center gap-2">
                    Updated
                    {getSortIcon('updatedAt')}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">PA-{item.id}</TableCell>
                  <TableCell>{item.patientName}</TableCell>
                  <TableCell>{item.medication}</TableCell>
                  <TableCell>{item.payer}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <Badge variant={getStatusBadgeVariant(item.status)}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewPA(item)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PA Details Sheet - Lazy loaded */}
      <Sheet open={showPASheet} onOpenChange={setShowPASheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Prior Authorization Details</SheetTitle>
          </SheetHeader>
          {selectedPA && (
            <Suspense fallback={<ComponentSkeleton />}>
              <PADetails pa={selectedPA} />
            </Suspense>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}