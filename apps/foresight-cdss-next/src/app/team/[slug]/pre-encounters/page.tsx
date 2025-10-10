'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, User, AlertTriangle, CheckCircle, Mail, ExternalLink, Filter, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PreEncounterIssue } from '@/types/pre-encounter.types';
import {
  mockPreEncounterIssues,
  mockPreEncounterAnalytics,
  getIssueTypeLabel,
  getIssuePriorityColor,
  getIssueStatusColor
} from '@/data/pre-encounter';

export default function PreEncountersPage() {
  const [issues, setIssues] = useState<PreEncounterIssue[]>(mockPreEncounterIssues);
  const [selectedIssue, setSelectedIssue] = useState<PreEncounterIssue | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as 'all' | 'pending' | 'in_progress' | 'resolved',
    priority: 'all' as 'all' | 'low' | 'medium' | 'high',
    issueType: 'all' as 'all' | PreEncounterIssue['issueType'],
    payer: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const analytics = mockPreEncounterAnalytics;

  // Extract payers from issues
  const payers = useMemo(() => {
    const payerSet = new Set(issues.map(issue => issue.payerName).filter((name): name is string => Boolean(name)));
    return Array.from(payerSet).sort().map(name => ({ name }));
  }, [issues]);

  const hasActiveFilters = () => {
    return (
      filters.search.trim() !== '' ||
      filters.status !== 'all' ||
      filters.priority !== 'all' ||
      filters.issueType !== 'all' ||
      filters.payer !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== ''
    );
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = !filters.search.trim() ||
      issue.patientName.toLowerCase().includes(filters.search.toLowerCase()) ||
      issue.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      issue.payerName?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = filters.status === 'all' || issue.status === filters.status;
    const matchesPriority = filters.priority === 'all' || issue.priority === filters.priority;
    const matchesIssueType = filters.issueType === 'all' || issue.issueType === filters.issueType;
    const matchesPayer = filters.payer === 'all' || issue.payerName === filters.payer;

    // Date filtering - check against appointment date
    let matchesDateFrom = true;
    let matchesDateTo = true;

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      const appointmentDate = new Date(issue.appointmentDate);
      matchesDateFrom = appointmentDate >= from;
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      const appointmentDate = new Date(issue.appointmentDate);
      matchesDateTo = appointmentDate <= to;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesIssueType && matchesPayer && matchesDateFrom && matchesDateTo;
  });

  const handleSendInfoRequest = (issueId: string, patientName: string) => {
    // Update the issue to mark when the info request was sent
    setIssues(prev => prev.map(issue =>
      issue.id === issueId
        ? { ...issue, infoRequestSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : issue
    ));

    // Stub: Send email/SMS to patient for updated insurance
    toast.success(`Info request sent to ${patientName} via email/SMS`, {
      description: "The patient will receive notifications about updating their insurance information.",
      duration: 4000,
    });
  };

  const handleResolveIssue = () => {
    if (!selectedIssue) return;

    setIssues(prev => prev.map(issue =>
      issue.id === selectedIssue.id
        ? { ...issue, status: 'resolved' as const, updatedAt: new Date().toISOString() }
        : issue
    ));

    setShowResolveDialog(false);
    setSelectedIssue(null);
    setResolveNotes('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pre-Encounter Checks</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage eligibility verification and pre-visit issues for upcoming appointments
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Success Rate: {analytics.successRate}%</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{analytics.totalIssues} Active Issues</span>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Encounters</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.totalUpcomingEncounters}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Issues</p>
                <p className="text-2xl font-bold text-red-600">{analytics.totalIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">{analytics.resolvedIssues}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{analytics.successRate}%</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search patients, issues, payers..."
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: event.target.value,
                    }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
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
                    {[filters.status !== 'all', filters.priority !== 'all', filters.issueType !== 'all', filters.payer !== 'all', filters.dateFrom, filters.dateTo, filters.search]
                      .filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      search: '',
                      status: 'all',
                      priority: 'all',
                      issueType: 'all',
                      payer: 'all',
                      dateFrom: '',
                      dateTo: '',
                    });
                  }}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Badges */}
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
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status.replace('_', ' ')}
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
              {filters.priority !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Priority: {filters.priority}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setFilters(prev => ({ ...prev, priority: 'all' }))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {filters.issueType !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Type: {getIssueTypeLabel(filters.issueType)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setFilters(prev => ({ ...prev, issueType: 'all' }))}
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

          {/* Filter Controls */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground mb-3">Quick Filters</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-select">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: value as 'all' | 'pending' | 'in_progress' | 'resolved',
                        }))
                      }
                    >
                      <SelectTrigger id="status-select">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority-select">Priority</Label>
                    <Select
                      value={filters.priority}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          priority: value as 'all' | 'low' | 'medium' | 'high',
                        }))
                      }
                    >
                      <SelectTrigger id="priority-select">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issue-type-select">Issue Type</Label>
                    <Select
                      value={filters.issueType}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          issueType: value as 'all' | PreEncounterIssue['issueType'],
                        }))
                      }
                    >
                      <SelectTrigger id="issue-type-select">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="insurance_not_verified">Insurance Not Verified</SelectItem>
                        <SelectItem value="provider_not_credentialed">Provider Not Credentialed</SelectItem>
                        <SelectItem value="expired_insurance">Expired Insurance</SelectItem>
                        <SelectItem value="missing_information">Missing Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer-select">Payer</Label>
                    <Select
                      value={filters.payer}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, payer: value }))
                      }
                    >
                      <SelectTrigger id="payer-select">
                        <SelectValue placeholder="All Payers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payers</SelectItem>
                        {payers.map((payer) => (
                          <SelectItem key={payer.name} value={payer.name}>
                            {payer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                          onSelect={(date) => {
                            setFilters((prev) => ({
                              ...prev,
                              dateFrom: date ? date.toISOString().split('T')[0] : '',
                            }));
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date > today;
                          }}
                          className="rounded-lg border shadow-xs"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Date To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                          onSelect={(date) => {
                            setFilters((prev) => ({
                              ...prev,
                              dateTo: date ? date.toISOString().split('T')[0] : '',
                            }));
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
                            const isAfterToday = date > today;
                            const isBeforeFromDate = fromDate ? date < fromDate : false;
                            return isAfterToday || isBeforeFromDate;
                          }}
                          className="rounded-lg border shadow-xs"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Encounter Issues</CardTitle>
          <CardDescription>
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''} requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {issue.patientName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(issue.appointmentDate)}
                        </span>
                      </div>
                      <Badge className={getIssueStatusColor(issue.status)}>
                        {issue.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getIssuePriorityColor(issue.priority)}>
                        {issue.priority} priority
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {getIssueTypeLabel(issue.issueType)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {issue.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      {issue.providerName && (
                        <span>Provider: {issue.providerName}</span>
                      )}
                      {issue.payerName && (
                        <span>Payer: {issue.payerName}</span>
                      )}
                      <span>Updated: {formatTime(issue.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end ml-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIssue(issue);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Details
                      </Button>

                      {(issue.issueType === 'missing_information' || issue.issueType === 'expired_insurance') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendInfoRequest(issue.id, issue.patientName)}
                          disabled={!!issue.infoRequestSentAt}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Send Info Request
                        </Button>
                      )}

                      {issue.status !== 'resolved' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedIssue(issue);
                            setShowResolveDialog(true);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>

                    {/* Info Request Status - shown below buttons */}
                    {(issue.issueType === 'missing_information' || issue.issueType === 'expired_insurance') && issue.infoRequestSentAt && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Request Sent
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(issue.infoRequestSentAt)} at {formatTime(issue.infoRequestSentAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredIssues.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {issues.length === 0 ? 'No pre-encounter issues found' : 'No issues match your current filters'}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  All upcoming encounters are ready for appointments
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issue Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pre-Encounter Issue Details</DialogTitle>
            <DialogDescription>
              Complete information about this pre-encounter issue
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patient</Label>
                  <p className="text-sm">{selectedIssue.patientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Appointment Date</Label>
                  <p className="text-sm">{formatDate(selectedIssue.appointmentDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Provider</Label>
                  <p className="text-sm">{selectedIssue.providerName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payer</Label>
                  <p className="text-sm">{selectedIssue.payerName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Issue Type</Label>
                  <p className="text-sm">{getIssueTypeLabel(selectedIssue.issueType)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={getIssuePriorityColor(selectedIssue.priority)}>
                    {selectedIssue.priority} priority
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  {selectedIssue.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{formatDate(selectedIssue.createdAt)} at {formatTime(selectedIssue.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm">{formatDate(selectedIssue.updatedAt)} at {formatTime(selectedIssue.updatedAt)}</p>
                </div>
              </div>

              {/* Info Request Status */}
              {(selectedIssue.issueType === 'missing_information' || selectedIssue.issueType === 'expired_insurance') && (
                <div>
                  <Label className="text-sm font-medium">Info Request Status</Label>
                  {selectedIssue.infoRequestSentAt ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Request Sent
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        on {formatDate(selectedIssue.infoRequestSentAt)} at {formatTime(selectedIssue.infoRequestSentAt)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      No info request sent yet
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Issue Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Pre-Encounter Issue</DialogTitle>
            <DialogDescription>
              Mark this issue as resolved and provide any additional notes
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              <div>
                <Label>Patient: {selectedIssue.patientName}</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getIssueTypeLabel(selectedIssue.issueType)} - {selectedIssue.description}
                </p>
              </div>

              <div>
                <Label htmlFor="resolve-notes">Resolution Notes (Optional)</Label>
                <Textarea
                  id="resolve-notes"
                  placeholder="Describe how this issue was resolved..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveIssue}>
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
