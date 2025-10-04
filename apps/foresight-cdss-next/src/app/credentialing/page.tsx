"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Initial credentialing data based on the HTML example
const initialCredentialingData = [
  { id: 1, state: 'MI', payer: 'Meridian', status: 'Active', next: '—', contact: 'portal' },
  { id: 2, state: 'MI', payer: 'Molina', status: 'Active', next: '—', contact: 'portal' },
  { id: 3, state: 'OH', payer: 'CareSource', status: 'In Progress', next: 'Awaiting CAQH attestation', contact: 'rep: cs-at-oh' },
  { id: 4, state: 'KY', payer: 'Anthem', status: 'Requested', next: 'Submit roster', contact: 'email' },
  { id: 5, state: 'TX', payer: 'Superior', status: 'Active', next: 'Add new site', contact: 'portal' },
  { id: 6, state: 'AZ', payer: 'AZ Complete Health', status: 'Planned', next: 'Start app', contact: '—' },
  { id: 7, state: 'FL', payer: 'Sunshine', status: 'In Progress', next: 'Taxonomy update', contact: 'portal' },
  { id: 8, state: 'IN', payer: 'MDwise', status: 'Planned', next: 'Credential NPs', contact: 'rep: mdw-in' }
];

// State filter options
const states = ['All', 'MI', 'OH', 'KY', 'TX', 'AZ', 'FL', 'IN'];

export default function CredentialingPage() {
  const [stateFilter, setStateFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [credentialingData, setCredentialingData] = useState(initialCredentialingData);
  const [newStatus, setNewStatus] = useState('');
  const [showCaqhModal, setShowCaqhModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showStatusReportModal, setShowStatusReportModal] = useState(false);
  const [showNewApplicationModal, setShowNewApplicationModal] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    includeTimeline: true,
    showContacts: true,
    includePendingRequirements: false,
  });
  const [reportPeriod, setReportPeriod] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
      case 'Requested':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Planned':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredData = credentialingData.filter(item =>
    stateFilter === 'All' || item.state === stateFilter
  );

  const getStatusCounts = () => {
    const counts = {
      Active: filteredData.filter(item => item.status === 'Active').length,
      'In Progress': filteredData.filter(item => item.status === 'In Progress').length,
      Requested: filteredData.filter(item => item.status === 'Requested').length,
      Planned: filteredData.filter(item => item.status === 'Planned').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const handleUpdateStatus = () => {
    if (!selectedItem || !newStatus) return;

    setCredentialingData(prev =>
      prev.map(item =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: newStatus,
              next: getNextStepForStatus(newStatus)
            }
          : item
      )
    );
    setSelectedItem(null);
    setNewStatus('');
  };

  const getNextStepForStatus = (status: string) => {
    switch (status) {
      case 'Active':
        return '—';
      case 'In Progress':
        return 'Complete pending requirements';
      case 'Requested':
        return 'Submit application materials';
      case 'Planned':
        return 'Begin credentialing process';
      default:
        return '—';
    }
  };

  const availableStatuses = ['Planned', 'Requested', 'In Progress', 'Active'];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Credentialing Tracker
        </h1>
        <p className="text-gray-600 mt-1">
          Multi-state payer credentialing status — keep operations moving across
          all markets.
        </p>
      </header>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-sm mb-1">Active</h3>
            <p className="text-2xl font-bold text-emerald-700">
              {statusCounts.Active}
            </p>
            <p className="text-xs text-gray-500 mt-1">Credentialing Complete</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-sm mb-1">In Progress</h3>
            <p className="text-2xl font-bold text-yellow-700">
              {statusCounts["In Progress"]}
            </p>
            <p className="text-xs text-gray-500 mt-1">Pending Steps</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-sm mb-1">Requested</h3>
            <p className="text-2xl font-bold text-yellow-700">
              {statusCounts.Requested}
            </p>
            <p className="text-xs text-gray-500 mt-1">Awaiting Submission</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-sm mb-1">Planned</h3>
            <p className="text-2xl font-bold text-gray-700">
              {statusCounts.Planned}
            </p>
            <p className="text-xs text-gray-500 mt-1">Future Initiatives</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            Filter by State:
          </span>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-500">
            Showing {filteredData.length} of {credentialingData.length}{" "}
            credentialing records
          </span>
        </div>
      </div>

      {/* Credentialing Table */}
      <Card className="bg-white border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Credentialing Status by State & Payer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">State</th>
                  <th className="py-3 px-4 font-semibold">Payer</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Next Step</th>
                  <th className="py-3 px-4 font-semibold">Contact Method</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((item, index) => (
                  <tr
                    key={`${item.state}-${item.payer}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.state}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{item.payer}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(item.status)} font-medium`}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-[200px]">
                      {item.next === "—" ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        item.next
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.contact === "portal" && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700"
                        >
                          Portal
                        </Badge>
                      )}
                      {item.contact === "email" && (
                        <Badge
                          variant="secondary"
                          className="bg-green-50 text-green-700"
                        >
                          Email
                        </Badge>
                      )}
                      {item.contact.startsWith("rep:") && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-50 text-purple-700"
                        >
                          Rep: {item.contact.split(":")[1]}
                        </Badge>
                      )}
                      {item.contact === "—" && (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "Active" ? (
                        <Button variant="outline" size="sm" disabled>
                          Complete
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-indigo-600 hover:text-indigo-700"
                          onClick={() => setSelectedItem(item)}
                        >
                          Update
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Completion Rate
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${
                      (statusCounts.Active / filteredData.length) * 100
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Math.round((statusCounts.Active / filteredData.length) * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {statusCounts.Active} of {filteredData.length} payers active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Priority Actions
            </h3>
            <p className="text-2xl font-bold text-yellow-700 mb-1">
              {statusCounts["In Progress"] + statusCounts.Requested}
            </p>
            <p className="text-xs text-gray-500">Items requiring attention</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Coverage</h3>
            <p className="text-2xl font-bold text-indigo-700 mb-1">
              {new Set(filteredData.map((item) => item.state)).size}
            </p>
            <p className="text-xs text-gray-500">
              States with active credentialing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white border shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              className="justify-start"
              variant="outline"
              onClick={() => setShowCaqhModal(true)}
            >
              <span className="mr-2">📄</span>
              CAQH Update
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              onClick={() => setShowFollowUpModal(true)}
            >
              <span className="mr-2">📧</span>
              Follow Up
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              onClick={() => setShowStatusReportModal(true)}
            >
              <span className="mr-2">📊</span>
              Status Report
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              onClick={() => setShowNewApplicationModal(true)}
            >
              <span className="mr-2">➕</span>
              New Application
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Update Credentialing - {selectedItem?.payer} (
              {selectedItem?.state})
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(
                      selectedItem.status
                    )} font-medium`}
                  >
                    {selectedItem.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Step
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  {selectedItem.next === "—"
                    ? "No next step defined"
                    : selectedItem.next}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Method
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  {selectedItem.contact === "portal" && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700"
                    >
                      Portal
                    </Badge>
                  )}
                  {selectedItem.contact === "email" && (
                    <Badge
                      variant="secondary"
                      className="bg-green-50 text-green-700"
                    >
                      Email
                    </Badge>
                  )}
                  {selectedItem.contact.startsWith("rep:") && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-50 text-purple-700"
                    >
                      Rep: {selectedItem.contact.split(":")[1]}
                    </Badge>
                  )}
                  {selectedItem.contact === "—" && (
                    <span className="text-gray-400">No contact method</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses
                      .filter((status) => status !== selectedItem.status)
                      .map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Close
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CAQH Update Dialog */}
      <Dialog open={showCaqhModal} onOpenChange={setShowCaqhModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>CAQH Profile Update</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                Update your CAQH profile to ensure all credentialing
                applications have the latest information.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">
                  Profile Completeness
                </span>
                <Badge className="bg-emerald-50 text-emerald-700">
                  95% Complete
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">Last Updated</span>
                <span className="text-sm text-gray-600">2 weeks ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">Expiring Documents</span>
                <Badge variant="destructive">3 items</Badge>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                Action Required
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>
                  • Update malpractice insurance certificate (expires in 30
                  days)
                </li>
                <li>• Verify DEA registration renewal</li>
                <li>• Complete continuing education documentation</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCaqhModal(false)}>
              Close
            </Button>
            <Button onClick={() => setShowCaqhModal(false)}>
              Open CAQH Portal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow Up Dialog */}
      <Dialog open={showFollowUpModal} onOpenChange={setShowFollowUpModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Follow Up Actions</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Credentialing Items
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose items to follow up on" />
                </SelectTrigger>
                <SelectContent>
                  {credentialingData
                    .filter((item) => item.status !== "Active")
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.payer} ({item.state}) - {item.status}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow Up Action
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select follow up type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Send Status Email</SelectItem>
                  <SelectItem value="call">Schedule Phone Call</SelectItem>
                  <SelectItem value="portal">Check Portal Update</SelectItem>
                  <SelectItem value="documents">
                    Request Missing Documents
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                Pending Follow-ups
              </h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>CareSource (OH) - CAQH attestation</span>
                  <span className="text-gray-500">Due: Tomorrow</span>
                </div>
                <div className="flex justify-between">
                  <span>Anthem (KY) - Roster submission</span>
                  <span className="text-gray-500">Due: Next week</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFollowUpModal(false)}
            >
              Close
            </Button>
            <Button onClick={() => setShowFollowUpModal(false)}>
              Schedule Follow Up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Report Dialog */}
      <Dialog
        open={showStatusReportModal}
        onOpenChange={setShowStatusReportModal}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Credentialing Status Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">
                  Report Period
                </h4>
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>

                {reportPeriod === "custom" && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={customDateRange.startDate}
                        onChange={(e) =>
                          setCustomDateRange((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        value={customDateRange.endDate}
                        onChange={(e) =>
                          setCustomDateRange((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">
                  Include States
                </h4>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {states
                      .filter((s) => s !== "All")
                      .map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {statusCounts.Active}
                </p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {statusCounts["In Progress"]}
                </p>
                <p className="text-xs text-gray-600">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {statusCounts.Requested}
                </p>
                <p className="text-xs text-gray-600">Requested</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">
                  {statusCounts.Planned}
                </p>
                <p className="text-xs text-gray-600">Planned</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-800 mb-2">Report Options</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-timeline"
                    checked={reportOptions.includeTimeline}
                    onCheckedChange={(checked) =>
                      setReportOptions((prev) => ({
                        ...prev,
                        includeTimeline: checked,
                      }))
                    }
                  />
                  <Label
                    htmlFor="include-timeline"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include detailed timeline
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-contacts"
                    checked={reportOptions.showContacts}
                    onCheckedChange={(checked) =>
                      setReportOptions((prev) => ({
                        ...prev,
                        showContacts: checked,
                      }))
                    }
                  />
                  <Label
                    htmlFor="show-contacts"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Show contact information
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-pending"
                    checked={reportOptions.includePendingRequirements}
                    onCheckedChange={(checked) =>
                      setReportOptions((prev) => ({
                        ...prev,
                        includePendingRequirements: checked,
                      }))
                    }
                  />
                  <Label
                    htmlFor="include-pending"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include pending requirements
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusReportModal(false)}
            >
              Close
            </Button>
            <Button onClick={() => setShowStatusReportModal(false)}>
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Application Dialog */}
      <Dialog
        open={showNewApplicationModal}
        onOpenChange={setShowNewApplicationModal}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Credentialing Application</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states
                    .filter((s) => s !== "All")
                    .map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payer/Health Plan
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select payer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anthem">Anthem BCBS</SelectItem>
                  <SelectItem value="aetna">Aetna</SelectItem>
                  <SelectItem value="humana">Humana</SelectItem>
                  <SelectItem value="unitedhealthcare">
                    UnitedHealthcare
                  </SelectItem>
                  <SelectItem value="cigna">Cigna</SelectItem>
                  <SelectItem value="medicaid">State Medicaid</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Type
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physician">Physician (MD/DO)</SelectItem>
                  <SelectItem value="np">Nurse Practitioner</SelectItem>
                  <SelectItem value="pa">Physician Assistant</SelectItem>
                  <SelectItem value="therapist">Therapist/Counselor</SelectItem>
                  <SelectItem value="facility">
                    Facility/Organization
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                Prerequisites
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• CAQH profile must be complete and up-to-date</li>
                <li>• Valid state license for selected state</li>
                <li>• Current malpractice insurance</li>
                <li>• DEA registration (if applicable)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewApplicationModal(false)}
            >
              Close
            </Button>
            <Button onClick={() => setShowNewApplicationModal(false)}>
              Start Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
