"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data based on the HTML example
const encounters = [
  { id: 'ENC-3201', patient: 'A. Johnson', state: 'MI', payer: 'Meridian (MI Medicaid)', dos: '2025-09-20', visit: 'Telehealth', status: 'Needs Review' },
  { id: 'ENC-3202', patient: 'M. Rivera', state: 'OH', payer: 'CareSource (OH Medicaid)', dos: '2025-09-21', visit: 'In-Person', status: 'Ready to Submit' },
  { id: 'ENC-3203', patient: 'K. Lee', state: 'KY', payer: 'Anthem BCBS', dos: '2025-09-22', visit: 'Telehealth', status: 'Needs Review' },
  { id: 'ENC-3204', patient: 'R. Patel', state: 'TX', payer: 'Superior (TX Medicaid)', dos: '2025-09-23', visit: 'Telehealth', status: 'Needs Review' },
  { id: 'ENC-3205', patient: 'P. Nguyen', state: 'FL', payer: 'Sunshine (FL Medicaid)', dos: '2025-09-24', visit: 'Telehealth', status: 'Ready to Submit' }
];

const denials = [
  { id: 'CLM-2136', state: 'TX', payer: 'Superior (TX Medicaid)', amount: 112.00, days: 6, carc: '197', rarc: 'N700', reason: 'Pre-cert required for 99213? Auth missing', dos: '2025-09-23' },
  { id: 'CLM-2141', state: 'MI', payer: 'BCBSM', amount: 78.40, days: 11, carc: '96', rarc: 'N620', reason: 'POS inconsistent — home video visit missing Mod 95', dos: '2025-09-18' }
];

export default function ClaimsPage() {
  const [noteShowSources, setNoteShowSources] = useState(true);
  const [claimStatus, setClaimStatus] = useState('built');
  const [selectedDenial, setSelectedDenial] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);

  const applyAllFixes = () => {
    setShowConfirmModal(true);
  };

  const confirmEM = () => {
    setShowConfirmModal(false);
    setClaimStatus('submitted');
    setTimeout(() => setClaimStatus('awaiting_277ca'), 900);
    setTimeout(() => setClaimStatus('accepted_277ca'), 2400);
  };

  const submitAndListen = () => {
    setClaimStatus('submitted');
    setTimeout(() => setClaimStatus('awaiting_277ca'), 900);
    setTimeout(() => setClaimStatus('accepted_277ca'), 2400);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted_277ca':
      case 'paid':
        return 'bg-emerald-50 text-emerald-700';
      case 'rejected_277ca':
      case 'denied':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-yellow-50 text-yellow-700';
    }
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Confirm Dialog */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm E/M Level Change</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Applying these fixes will preserve/adjust E/M <strong>99213</strong>
            . Manual confirmation required.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmEM}>Confirm & Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Claims Workbench — 99213 Default
        </h1>
        <p className="text-muted-foreground mt-1">
          Deterministic edits: Telehealth POS 10 + Mod 95; licensure; time-based
          E/M guard.
        </p>
      </header>

      {/* Encounters Table */}
      <Card className="bg-card border shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Encounter</th>
                  <th>Patient</th>
                  <th>State</th>
                  <th>Payer</th>
                  <th>DOS</th>
                  <th>Visit</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {encounters.map((enc) => (
                  <tr key={enc.id} className="hover:bg-accent/50">
                    <td className="py-2 font-medium">{enc.id}</td>
                    <td>{enc.patient}</td>
                    <td>{enc.state}</td>
                    <td>{enc.payer}</td>
                    <td>{enc.dos}</td>
                    <td>{enc.visit}</td>
                    <td>
                      <Badge
                        variant={
                          enc.status === "Needs Review"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {enc.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:underline"
                        onClick={() => setSelectedEncounter(enc)}
                      >
                        Open →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Workbench - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Chart Note */}
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Chart Note</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-sources"
                  checked={noteShowSources}
                  onCheckedChange={(checked) =>
                    setNoteShowSources(checked === true)
                  }
                />
                <Label
                  htmlFor="show-sources"
                  className="text-sm font-normal cursor-pointer"
                >
                  Show sources
                </Label>
              </div>
            </div>
            <div className="prose max-w-none text-sm leading-relaxed">
              <p>
                {noteShowSources && (
                  <mark className="px-1 rounded bg-yellow-100">Video</mark>
                )}{" "}
                follow-up for{" "}
                {noteShowSources && (
                  <mark className="px-1 rounded bg-yellow-100">
                    OUD on Suboxone
                  </mark>
                )}
                . Time today:{" "}
                {noteShowSources && (
                  <mark className="px-1 rounded bg-yellow-100">21 minutes</mark>
                )}{" "}
                with counseling.
              </p>
              <p>
                <strong>Assessment:</strong> OUD stable; craving controlled;
                PDMP reviewed.
              </p>
              <p>
                <strong>Plan:</strong> Continue buprenorphine/naloxone; therapy
                weekly; safety plan reviewed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Coding Suggestions */}
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">AI Coding Suggestions</h3>

            <div>
              <h4 className="text-xs uppercase text-muted-foreground mb-2">ICD-10</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-muted">
                  F11.20 <span className="text-muted-foreground ml-1">· 0.92</span>
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase text-muted-foreground mb-2">
                CPT/HCPCS
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      99213 <span className="text-muted-foreground">· E/M by time</span>
                    </div>
                    <div className="text-muted-foreground">
                      Modifiers: <strong>95</strong> (synchronous); POS:{" "}
                      <strong>10</strong> (home)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Charge</div>
                    <div className="font-semibold">$110</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase text-muted-foreground mb-2">
                Eligibility
              </h4>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-700">
                  Active ✓
                </Badge>
                <Badge className="bg-emerald-50 text-emerald-700">
                  PA not required for E/M
                </Badge>
              </div>
            </div>

            <div className="text-sm">
              <div className="flex items-center space-x-2">
                <Checkbox id="hold-erx" />
                <Label
                  htmlFor="hold-erx"
                  className="font-normal cursor-pointer"
                >
                  Hold eRx transmission until ePA = Approved
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-bill Edits */}
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pre-Bill Edits</h3>
              <span className="text-xs text-muted-foreground">
                277CA expectation: <strong>Accepted</strong>
              </span>
            </div>

            <ul className="text-sm space-y-2">
              <li className="flex items-center justify-between">
                <span>Telehealth synchronous → add Mod 95</span>
                <Badge className="bg-emerald-50 text-emerald-700">Pass</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Patient at home → POS 10</span>
                <Badge className="bg-emerald-50 text-emerald-700">Pass</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>E/M by time → minutes present</span>
                <Badge className="bg-emerald-50 text-emerald-700">Pass</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span>Licensure (state match)</span>
                <Badge className="bg-emerald-50 text-emerald-700">Pass</Badge>
              </li>
            </ul>

            <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded p-2">
              Payer hint: Home video visits require POS 10 + Mod 95.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={applyAllFixes}>
                  Apply All Fixes
                </Button>
                <Button onClick={submitAndListen}>Submit & Listen</Button>
              </div>
              <div className="flex items-center">
                <Badge
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    claimStatus
                  )}`}
                >
                  {claimStatus.replaceAll("_", " · ")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Denials Table */}
      <Card className="bg-card border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Recent Denials (835)
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Filters: State / Payer / CARC
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2">Claim</th>
                  <th>DOS</th>
                  <th>State</th>
                  <th>Payer</th>
                  <th>Amount</th>
                  <th>CARC/RARC</th>
                  <th>Reason</th>
                  <th>Days</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {denials.map((denial) => (
                  <tr key={denial.id} className="hover:bg-accent/50">
                    <td className="py-2 font-medium">{denial.id}</td>
                    <td>{denial.dos}</td>
                    <td>{denial.state}</td>
                    <td>{denial.payer}</td>
                    <td>${denial.amount.toFixed(2)}</td>
                    <td>
                      <Badge
                        variant="destructive"
                        className="bg-red-50 text-red-700"
                      >
                        {denial.carc} / {denial.rarc}
                      </Badge>
                    </td>
                    <td
                      className="max-w-[280px] truncate"
                      title={denial.reason}
                    >
                      {denial.reason}
                    </td>
                    <td>{denial.days}</td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:underline"
                        onClick={() => setSelectedDenial(denial)}
                      >
                        Open →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Denial Detail Dialog */}
      <Dialog
        open={!!selectedDenial}
        onOpenChange={() => setSelectedDenial(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Denial Detail — {selectedDenial?.id}</DialogTitle>
          </DialogHeader>

          {selectedDenial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Date of Service
                  </label>
                  <p className="text-foreground">{selectedDenial.dos}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    State
                  </label>
                  <p className="text-foreground">{selectedDenial.state}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Payer
                </label>
                <p className="text-sm text-foreground">{selectedDenial.payer}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  CARC/RARC Codes
                </label>
                <Badge variant="destructive" className="bg-red-50 text-red-700">
                  {selectedDenial.carc} / {selectedDenial.rarc}
                </Badge>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  Denial Reason
                </label>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">
                    {selectedDenial.reason}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  Playbook Suggestions
                </label>
                <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
                  <ul className="text-sm text-indigo-800 space-y-1">
                    {selectedDenial.carc === "197" && (
                      <li>
                        • Attach valid Auth# from ePA; resubmit as corrected
                        claim
                      </li>
                    )}
                    {selectedDenial.carc === "96" && (
                      <li>
                        • Set POS to 10 and add Mod 95; add note &quot;video
                        visit, 21 min&quot;
                      </li>
                    )}
                    <li>
                      • Re-run deterministic checks; log diffs in Audit Trail
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDenial(null)}>
              Close
            </Button>
            <Button onClick={() => setSelectedDenial(null)}>
              Apply & Resubmit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encounter Detail Drawer */}
      {selectedEncounter && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedEncounter(null)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l border-border shadow-xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">
                  Encounter Details — {selectedEncounter.id}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEncounter(null)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Patient
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedEncounter.patient}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Date of Service
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedEncounter.dos}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Visit Type
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedEncounter.visit}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        State
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedEncounter.state}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Payer
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedEncounter.payer}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Status
                      </label>
                      <Badge
                        variant={
                          selectedEncounter.status === "Needs Review"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {selectedEncounter.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-foreground mb-3">
                    Clinical Summary
                  </h4>
                  <div className="bg-muted rounded-md p-4 text-sm space-y-2">
                    <p>
                      <strong>Chief Complaint:</strong> Follow-up for OUD on
                      Suboxone
                    </p>
                    <p>
                      <strong>Assessment:</strong> OUD stable; craving
                      controlled; PDMP reviewed
                    </p>
                    <p>
                      <strong>Plan:</strong> Continue buprenorphine/naloxone;
                      therapy weekly; safety plan reviewed
                    </p>
                    <p>
                      <strong>Time:</strong> 21 minutes with counseling
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-foreground mb-3">
                    Coding Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Primary Diagnosis
                      </label>
                      <Badge variant="secondary" className="bg-muted">
                        F11.20 - Opioid Use Disorder
                      </Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Procedure Code
                      </label>
                      <Badge variant="secondary" className="bg-muted">
                        99213 - E/M Office Visit
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedEncounter.status === "Needs Review" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      Review Required
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Verify telehealth modifiers (95) are present</li>
                      <li>• Confirm place of service (10 - Home)</li>
                      <li>• Validate time-based E/M documentation</li>
                    </ul>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedEncounter(null)}
                    >
                      Close
                    </Button>
                    {selectedEncounter.status === "Needs Review" && (
                      <Button onClick={() => setSelectedEncounter(null)}>
                        Mark as Reviewed
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
