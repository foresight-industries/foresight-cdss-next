'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Download, MoreHorizontal, Clock, AlertCircle, CheckCircle, XCircle, Eye, Edit, FileText, MessageSquare, Archive, ChevronUp, ChevronDown, ArrowUpDown, X } from 'lucide-react';
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

interface QueueFilters {
  status: 'all' | 'needs-review' | 'auto-processing' | 'auto-approved' | 'denied';
  priority: 'all' | 'high' | 'medium' | 'low';
  payer: 'all' | 'Aetna' | 'UnitedHealth' | 'Cigna' | 'Anthem';
  confidence: 'all' | 'high' | 'medium' | 'low';
  patientName: string;
  paId: string;
  medication: string;
  conditions: string;
  attempt: string;
}

type SortField = 'id' | 'patientName' | 'medication' | 'payer' | 'status' | 'confidence' | 'updatedAt';
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

export default function QueuePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<QueueFilters>({
    status: 'all',
    priority: 'all',
    payer: 'all',
    confidence: 'all',
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
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for demonstration
  const mockQueueData = [
    {
      id: 'PA-2025-001',
      patientName: 'Sarah Johnson',
      patientId: 'P12345',
      conditions: 'Type 2 Diabetes',
      attempt: 'Initial PA Request',
      medication: 'Ozempic 0.5mg/dose pen',
      payer: 'Aetna',
      status: 'needs-review' as const,
      confidence: 85,
      updatedAt: '2 hours ago'
    },
    {
      id: 'PA-2025-002',
      patientName: 'Michael Chen',
      patientId: 'P12346',
      conditions: 'Hypertension',
      attempt: 'Prior Auth - Resubmission',
      medication: 'Eliquis 5mg',
      payer: 'UnitedHealth',
      status: 'auto-processing' as const,
      confidence: 92,
      updatedAt: '1 hour ago'
    },
    {
      id: 'PA-2025-003',
      patientName: 'Emma Rodriguez',
      patientId: 'P12347',
      conditions: 'Rheumatoid Arthritis',
      attempt: 'Step Therapy Override',
      medication: 'Humira 40mg/0.8mL',
      payer: 'Cigna',
      status: 'auto-approved' as const,
      confidence: 96,
      updatedAt: '30 minutes ago'
    },
    {
      id: 'PA-2025-004',
      patientName: 'James Wilson',
      patientId: 'P12348',
      conditions: 'Depression',
      attempt: 'Initial PA Request',
      medication: 'Trintellix 20mg',
      payer: 'Anthem',
      status: 'denied' as const,
      confidence: 65,
      updatedAt: '3 hours ago'
    },
    {
      id: 'PA-2025-005',
      patientName: 'Lisa Thompson',
      patientId: 'P12349',
      conditions: 'Migraine',
      attempt: 'Appeal Request',
      medication: 'Aimovig 70mg/mL',
      payer: 'Aetna',
      status: 'needs-review' as const,
      confidence: 78,
      updatedAt: '45 minutes ago'
    },
    {
      id: 'PA-2025-006',
      patientName: 'Robert Davis',
      patientId: 'P12350',
      conditions: 'COPD',
      attempt: 'Initial PA Request',
      medication: 'Spiriva Respimat',
      payer: 'UnitedHealth',
      status: 'auto-processing' as const,
      confidence: 89,
      updatedAt: '1.5 hours ago'
    },
    {
      id: 'PA-2025-007',
      patientName: 'Jennifer Lee',
      patientId: 'P12351',
      conditions: 'Psoriasis',
      attempt: 'Prior Auth - Resubmission',
      medication: 'Cosentyx 150mg/mL',
      payer: 'Cigna',
      status: 'auto-approved' as const,
      confidence: 94,
      updatedAt: '20 minutes ago'
    },
    {
      id: 'PA-2025-008',
      patientName: 'David Martinez',
      patientId: 'P12352',
      conditions: 'High Cholesterol',
      attempt: 'Initial PA Request',
      medication: 'Repatha 140mg/mL',
      payer: 'Anthem',
      status: 'needs-review' as const,
      confidence: 72,
      updatedAt: '2.5 hours ago'
    },
    {
      id: 'PA-2025-009',
      patientName: 'Amanda White',
      patientId: 'P12353',
      conditions: 'Asthma',
      attempt: 'Step Therapy Override',
      medication: 'Dupixent 300mg/2mL',
      payer: 'Aetna',
      status: 'auto-processing' as const,
      confidence: 87,
      updatedAt: '40 minutes ago'
    },
    {
      id: 'PA-2025-010',
      patientName: 'Christopher Brown',
      patientId: 'P12354',
      conditions: 'Crohn\'s Disease',
      attempt: 'Initial PA Request',
      medication: 'Stelara 90mg/mL',
      payer: 'UnitedHealth',
      status: 'auto-approved' as const,
      confidence: 91,
      updatedAt: '15 minutes ago'
    }
  ];

  // Use mock data instead of API call
  const queueData = mockQueueData;
  const isLoading = false;
  const error = null;

  const filteredData = useMemo(() => {
    const filtered = queueData.filter(item => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const matchesPayer = filters.payer === 'all' || item.payer === filters.payer;

      const confidenceLevel = item.confidence >= 90 ? 'high' : item.confidence >= 70 ? 'medium' : 'low';
      const matchesConfidence = filters.confidence === 'all' || confidenceLevel === filters.confidence;

      // Column-specific filters
      const matchesPatientName = !filters.patientName || item.patientName.toLowerCase().includes(filters.patientName.toLowerCase());
      const matchesPaId = !filters.paId || item.id.toLowerCase().includes(filters.paId.toLowerCase());
      const matchesMedication = !filters.medication || item.medication.toLowerCase().includes(filters.medication.toLowerCase());
      const matchesConditions = !filters.conditions || item.conditions.toLowerCase().includes(filters.conditions.toLowerCase());
      const matchesAttempt = !filters.attempt || item.attempt.toLowerCase().includes(filters.attempt.toLowerCase());

      return matchesSearch && matchesStatus && matchesPayer && matchesConfidence &&
             matchesPatientName && matchesPaId && matchesMedication && matchesConditions && matchesAttempt;
    });

    // Apply sorting
    if (sortConfig.field && sortConfig.direction) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.field!];
        let bValue: any = b[sortConfig.field!];

        // Handle special cases
        if (sortConfig.field === 'confidence') {
          aValue = a.confidence;
          bValue = b.confidence;
        } else if (sortConfig.field === 'updatedAt') {
          // Convert "X hours ago" to comparable numbers
          const extractTime = (str: string) => {
            const match = str.match(/(\d+(?:\.\d+)?)\s*(minute|hour)s?\s*ago/);
            if (!match) return 0;
            const value = parseFloat(match[1]);
            const unit = match[2];
            return unit === 'hour' ? value * 60 : value;
          };
          aValue = extractTime(a.updatedAt);
          bValue = extractTime(b.updatedAt);
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [queueData, searchTerm, filters, sortConfig]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">High ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Medium ({confidence}%)</Badge>;
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Low ({confidence}%)</Badge>;
  };


  const handleAction = (action: string, paId: string) => {
    // Handle different actions
    switch (action) {
      case 'view':
        router.push(`/pa/${paId}`);
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

  const hasActiveFilters = () => {
    return filters.status !== 'all' ||
           filters.payer !== 'all' ||
           filters.confidence !== 'all' ||
           filters.patientName !== '' ||
           filters.paId !== '' ||
           filters.medication !== '' ||
           filters.conditions !== '' ||
           filters.attempt !== '' ||
           searchTerm !== '';
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">PA Queue</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and review prior authorization requests ({filteredData.length} items)
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by patient, PA ID, medication, or payer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Toggle */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`${showFilters ? 'bg-accent' : ''} ${hasActiveFilters() ? 'border-primary text-primary' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {[filters.status !== 'all', filters.payer !== 'all', filters.confidence !== 'all',
                        filters.patientName, filters.paId, filters.medication, filters.conditions, filters.attempt, searchTerm]
                        .filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilters({
                        status: 'all',
                        priority: 'all',
                        payer: 'all',
                        confidence: 'all',
                        patientName: '',
                        paId: '',
                        medication: '',
                        conditions: '',
                        attempt: ''
                      });
                      setSearchTerm('');
                      setSortConfig({ field: null, direction: null });
                    }}
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
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchTerm}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.status !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {filters.status.replace('-', ' ')}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.payer !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Payer: {filters.payer}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, payer: 'all' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.confidence !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Confidence: {filters.confidence}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, confidence: 'all' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.patientName && (
                  <Badge variant="secondary" className="gap-1">
                    Patient: {filters.patientName}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, patientName: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.paId && (
                  <Badge variant="secondary" className="gap-1">
                    PA ID: {filters.paId}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, paId: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.medication && (
                  <Badge variant="secondary" className="gap-1">
                    Medication: {filters.medication}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, medication: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.conditions && (
                  <Badge variant="secondary" className="gap-1">
                    Condition: {filters.conditions}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, conditions: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {filters.attempt && (
                  <Badge variant="secondary" className="gap-1">
                    Attempt: {filters.attempt}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setFilters(prev => ({ ...prev, attempt: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                )}
                {sortConfig.field && (
                  <Badge variant="outline" className="gap-1">
                    Sorted by: {sortConfig.field} ({sortConfig.direction})
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setSortConfig({ field: null, direction: null })}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-select">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}>
                      <SelectTrigger id="status-select">
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

                  <div className="space-y-2">
                    <Label htmlFor="payer-select">Payer</Label>
                    <Select value={filters.payer} onValueChange={(value) => setFilters(prev => ({ ...prev, payer: value as any }))}>
                      <SelectTrigger id="payer-select">
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

                  <div className="space-y-2">
                    <Label htmlFor="confidence-select">Confidence</Label>
                    <Select value={filters.confidence} onValueChange={(value) => setFilters(prev => ({ ...prev, confidence: value as any }))}>
                      <SelectTrigger id="confidence-select">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="high">High (90%+)</SelectItem>
                        <SelectItem value="medium">Medium (70-89%)</SelectItem>
                        <SelectItem value="low">Low (&lt;70%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-muted-foreground">
                    💡 Use column filters by hovering over column headers for more specific filtering
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilters({
                        status: 'all',
                        priority: 'all',
                        payer: 'all',
                        confidence: 'all',
                        patientName: '',
                        paId: '',
                        medication: '',
                        conditions: '',
                        attempt: ''
                      });
                      setSearchTerm('');
                      setSortConfig({ field: null, direction: null });
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                        <span>Medication & Payer</span>
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
                        <span>Confidence</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleSort('confidence')}
                        >
                          {getSortIcon('confidence')}
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
                              <Label htmlFor="confidence-select-column">Filter by Confidence</Label>
                              <Select value={filters.confidence} onValueChange={(value) => setFilters(prev => ({ ...prev, confidence: value as any }))}>
                                <SelectTrigger id="confidence-select-column">
                                  <SelectValue placeholder="All Levels" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Levels</SelectItem>
                                  <SelectItem value="high">High (90%+)</SelectItem>
                                  <SelectItem value="medium">Medium (70-89%)</SelectItem>
                                  <SelectItem value="low">Low (&lt;70%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {filters.confidence !== 'all' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilters(prev => ({ ...prev, confidence: 'all' }))}
                                className="w-full"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Clear Confidence Filter
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
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
                      onClick={() => router.push(`/pa/${item.id}`)}
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
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.medication}</div>
                          <div className="text-sm text-muted-foreground">{item.payer}</div>
                        </div>
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
                        {getConfidenceBadge(item.confidence)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {item.updatedAt}
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
                  setSearchTerm('');
                  setFilters({
                    status: 'all',
                    priority: 'all',
                    payer: 'all',
                    confidence: 'all',
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
    </div>
  );
}
