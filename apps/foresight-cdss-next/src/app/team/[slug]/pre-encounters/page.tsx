'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, User, AlertTriangle, CheckCircle, Mail, ExternalLink } from 'lucide-react';
import { PreEncounterFilters, type PreEncounterFiltersType } from '@/components/filters';
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
  const [filters, setFilters] = useState<PreEncounterFiltersType>({
    search: '',
    status: 'all',
    priority: 'all',
    issueType: 'all',
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
      <div className="mb-6">
        <PreEncounterFilters
          filters={filters}
          onFiltersChange={setFilters}
          statusOptions={[
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' }
          ]}
          priorityOptions={[
            { value: 'high', label: 'High Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'low', label: 'Low Priority' }
          ]}
          issueTypeOptions={[
            { value: 'insurance_not_verified', label: 'Insurance Not Verified' },
            { value: 'provider_not_credentialed', label: 'Provider Not Credentialed' },
            { value: 'expired_insurance', label: 'Expired Insurance' },
            { value: 'missing_information', label: 'Missing Information' }
          ]}
          payerOptions={payers.map(payer => ({ value: payer.name, label: payer.name }))}
        />
      </div>

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
