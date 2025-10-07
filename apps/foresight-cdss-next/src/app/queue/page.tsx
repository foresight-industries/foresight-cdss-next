'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Download, MoreHorizontal, Clock, AlertCircle, CheckCircle, XCircle, Eye, Edit, FileText, MessageSquare, Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
// import { useRecentActivity } from '@/hooks/use-dashboard-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface QueueFilters {
  status: 'all' | 'needs-review' | 'auto-processing' | 'auto-approved' | 'denied';
  priority: 'all' | 'high' | 'medium' | 'low';
  payer: 'all' | 'Aetna' | 'UnitedHealth' | 'Cigna' | 'Anthem';
  confidence: 'all' | 'high' | 'medium' | 'low';
}

interface QueueItem {
  id: string;
  patientName: string;
  patientId: string;
  conditions: string;
  attempt: string;
  medication: string;
  payer: string;
  status: 'needs-review' | 'auto-processing' | 'auto-approved' | 'denied';
  confidence: number;
  updatedAt: string;
}

const createMockQueueData = (): QueueItem[] => {
  const now = new Date();
  const subtractMinutes = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

  return [
    {
      id: 'PA-2025-001',
      patientName: 'Sarah Johnson',
      patientId: 'P12345',
      conditions: 'Type 2 Diabetes',
      attempt: 'Initial PA Request',
      medication: 'Ozempic 0.5mg/dose pen',
      payer: 'Aetna',
      status: 'needs-review',
      confidence: 85,
      updatedAt: subtractMinutes(120)
    },
    {
      id: 'PA-2025-002',
      patientName: 'Michael Chen',
      patientId: 'P12346',
      conditions: 'Hypertension',
      attempt: 'Prior Auth - Resubmission',
      medication: 'Eliquis 5mg',
      payer: 'UnitedHealth',
      status: 'auto-processing',
      confidence: 92,
      updatedAt: subtractMinutes(60)
    },
    {
      id: 'PA-2025-003',
      patientName: 'Emma Rodriguez',
      patientId: 'P12347',
      conditions: 'Rheumatoid Arthritis',
      attempt: 'Step Therapy Override',
      medication: 'Humira 40mg/0.8mL',
      payer: 'Cigna',
      status: 'auto-approved',
      confidence: 96,
      updatedAt: subtractMinutes(30)
    },
    {
      id: 'PA-2025-004',
      patientName: 'James Wilson',
      patientId: 'P12348',
      conditions: 'Depression',
      attempt: 'Initial PA Request',
      medication: 'Trintellix 20mg',
      payer: 'Anthem',
      status: 'denied',
      confidence: 65,
      updatedAt: subtractMinutes(180)
    },
    {
      id: 'PA-2025-005',
      patientName: 'Lisa Thompson',
      patientId: 'P12349',
      conditions: 'Migraine',
      attempt: 'Appeal Request',
      medication: 'Aimovig 70mg/mL',
      payer: 'Aetna',
      status: 'needs-review',
      confidence: 78,
      updatedAt: subtractMinutes(45)
    },
    {
      id: 'PA-2025-006',
      patientName: 'Robert Davis',
      patientId: 'P12350',
      conditions: 'COPD',
      attempt: 'Initial PA Request',
      medication: 'Spiriva Respimat',
      payer: 'UnitedHealth',
      status: 'auto-processing',
      confidence: 89,
      updatedAt: subtractMinutes(90)
    },
    {
      id: 'PA-2025-007',
      patientName: 'Jennifer Lee',
      patientId: 'P12351',
      conditions: 'Psoriasis',
      attempt: 'Prior Auth - Resubmission',
      medication: 'Cosentyx 150mg/mL',
      payer: 'Cigna',
      status: 'auto-approved',
      confidence: 94,
      updatedAt: subtractMinutes(20)
    },
    {
      id: 'PA-2025-008',
      patientName: 'David Martinez',
      patientId: 'P12352',
      conditions: 'High Cholesterol',
      attempt: 'Initial PA Request',
      medication: 'Repatha 140mg/mL',
      payer: 'Anthem',
      status: 'needs-review',
      confidence: 72,
      updatedAt: subtractMinutes(150)
    },
    {
      id: 'PA-2025-009',
      patientName: 'Amanda White',
      patientId: 'P12353',
      conditions: 'Asthma',
      attempt: 'Step Therapy Override',
      medication: 'Dupixent 300mg/2mL',
      payer: 'Aetna',
      status: 'auto-processing',
      confidence: 87,
      updatedAt: subtractMinutes(40)
    },
    {
      id: 'PA-2025-010',
      patientName: 'Christopher Brown',
      patientId: 'P12354',
      conditions: 'Crohn\'s Disease',
      attempt: 'Initial PA Request',
      medication: 'Stelara 90mg/mL',
      payer: 'UnitedHealth',
      status: 'auto-approved',
      confidence: 91,
      updatedAt: subtractMinutes(15)
    }
  ];
};

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
    confidence: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPaId, setSelectedPaId] = useState<string | null>(null);

  const queueData = useMemo<QueueItem[]>(() => createMockQueueData(), []);
  const isLoading = false;
  const error = null;

  const sortedData = useMemo(() => {
    return [...queueData].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [queueData]);

  const filteredData = useMemo(() => {
    return sortedData.filter(item => {
      const matchesSearch =
        item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payer.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      const matchesPayer = filters.payer === 'all' || item.payer === filters.payer;

      const confidenceLevel = item.confidence >= 90 ? 'high' : item.confidence >= 70 ? 'medium' : 'low';
      const matchesConfidence = filters.confidence === 'all' || confidenceLevel === filters.confidence;

      return matchesSearch && matchesStatus && matchesPayer && matchesConfidence;
    });
  }, [sortedData, searchTerm, filters]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">High ({confidence}%)</Badge>;
    if (confidence >= 70) return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Medium ({confidence}%)</Badge>;
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Low ({confidence}%)</Badge>;
  };

  const formatUpdatedAt = (dateString: string) => {
    const updatedDate = new Date(dateString);

    if (Number.isNaN(updatedDate.getTime())) {
      return dateString;
    }

    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();

    if (diffMs <= 0) {
      return 'Just now';
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Just now';
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(updatedDate);
  };


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
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-accent' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({
                      status: 'all',
                      priority: 'all',
                      payer: 'all',
                      confidence: 'all'
                    })}
                    className="w-full"
                  >
                    Clear Filters
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
                    PA Details
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    Patient
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    Medication
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    Payer
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    Confidence
                  </TableHead>
                  <TableHead className="px-6 py-3">
                    Updated
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
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.medication}</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.payer}</div>
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
                        {formatUpdatedAt(item.updatedAt)}
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
                    confidence: 'all'
                  });
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PA Details Modal */}
      <Dialog
        open={Boolean(selectedPaId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaId(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[92vw] h-[88vh] p-0 overflow-hidden">
          {selectedPaId && (
            <iframe
              key={selectedPaId}
              src={`/pa/${selectedPaId}`}
              title={`Prior authorization ${selectedPaId}`}
              className="w-full h-full border-0 rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
