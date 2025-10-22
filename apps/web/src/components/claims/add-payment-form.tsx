'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormErrorBoundary } from '@/components/error-boundaries';
import { formatCurrency, calculateClaimBalance, type Claim } from '@/data/claims';
import { toast } from 'sonner';

interface AddPaymentFormProps {
  claim: Claim;
  onPaymentAdded: (payment: {
    amount: number;
    payer: string;
    reference?: string;
    note?: string;
  }) => void;
  onCancel: () => void;
}

export function AddPaymentForm({
  claim,
  onPaymentAdded,
  onCancel,
}: Readonly<AddPaymentFormProps>) {
  const [amount, setAmount] = useState<string>("");
  const [payer, setPayer] = useState<string>("insurance");
  const [reference, setReference] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const claimBalance = calculateClaimBalance(claim);
  const parsedAmount = parseFloat(amount) || 0;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    if (!amount.trim()) {
      newErrors.amount = "Payment amount is required";
    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Amount must be a positive number";
    } else if (parsedAmount > claimBalance + 100) {
      // Allow small overpayment buffer
      newErrors.amount = `Amount cannot exceed claim balance by more than $100 (Balance: ${formatCurrency(
        claimBalance
      )})`;
    }

    // Payer validation
    if (!payer.trim()) {
      newErrors.payer = "Payer is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onPaymentAdded({
        amount: parsedAmount,
        payer:
          payer === "insurance"
            ? claim.payer.name
            : payer === "patient"
            ? "Patient"
            : payer,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });

      toast.success(
        `Payment of ${formatCurrency(parsedAmount)} recorded successfully`
      );
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to record payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      return;
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setAmount(cleanValue);

    // Clear amount error when user starts typing
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }));
    }
  };

  const isOverpayment = parsedAmount > claimBalance;
  const remainingAfterPayment = Math.max(0, claimBalance - parsedAmount);

  const hasUnsavedData = amount.trim() !== "" || reference.trim() !== "" || note.trim() !== "";

  return (
    <FormErrorBoundary 
      formName="payment form" 
      hasUnsavedData={hasUnsavedData}
      onRestore={() => {
        // Clear form data
        setAmount("");
        setReference("");
        setNote("");
        setPayer("insurance");
        setErrors({});
      }}
    >
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Add Payment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Record a payment for claim {claim.id}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Claim Balance Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Claim Total:</span>
            <span className="font-medium">
              {formatCurrency(claim.total_amount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Current Balance:</span>
            <span className="font-semibold">
              {formatCurrency(claimBalance)}
            </span>
          </div>
          {parsedAmount > 0 && (
            <div className="flex justify-between items-center text-sm mt-1 pt-1 border-t">
              <span className="text-muted-foreground">After Payment:</span>
              <span
                className={`font-semibold ${
                  remainingAfterPayment === 0
                    ? "text-green-600"
                    : "text-foreground"
                }`}
              >
                {formatCurrency(remainingAfterPayment)}
              </span>
            </div>
          )}
        </div>

        {/* Amount Field */}
        <div className="space-y-2">
          <Label htmlFor="amount">Payment Amount *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`pl-8 ${errors.amount ? "border-red-500" : ""}`}
              aria-describedby={errors.amount ? "amount-error" : undefined}
            />
          </div>
          {errors.amount && (
            <p id="amount-error" className="text-sm text-red-600">
              {errors.amount}
            </p>
          )}
          {isOverpayment && !errors.amount && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This payment exceeds the claim balance. The excess will result
                in an overpayment.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Payer Field */}
        <div className="space-y-2">
          <Label htmlFor="payer">Payer *</Label>
          <Select value={payer} onValueChange={setPayer}>
            <SelectTrigger className={errors.payer ? "border-red-500" : ""}>
              <SelectValue placeholder="Select payer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="insurance">
                {claim.payer.name} (Insurance)
              </SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.payer && (
            <p id="payer-error" className="text-sm text-red-600">
              {errors.payer}
            </p>
          )}
        </div>

        {/* Reference Field */}
        <div className="space-y-2">
          <Label htmlFor="reference">Reference (Optional)</Label>
          <Input
            id="reference"
            type="text"
            placeholder="Check #, EFT trace, etc."
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            maxLength={50}
          />
        </div>

        {/* Note Field */}
        <div className="space-y-2">
          <Label htmlFor="note">Note (Optional)</Label>
          <Textarea
            id="note"
            placeholder="Additional notes about this payment"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={200}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !amount.trim() || !payer.trim()}
            className="flex-1"
          >
            {isSubmitting ? "Recording..." : "Record Payment"}
          </Button>
        </div>
        </form>
      </div>
    </FormErrorBoundary>
  );
}
