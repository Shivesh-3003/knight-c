import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ReallocationModal } from "@/components/ReallocationModal";
import { treasuryContract } from "@/lib/wagmi";
import { treasuryVaultAddress } from "@/lib/contract";
import {
  stringToBytes32,
  parseUSDC,
  formatUSDC,
  isValidAddress,
  getExplorerTxUrl,
  truncateTxHash,
} from "@/lib/utils";

interface BatchPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pot: {
    id: string;
    name: string;
    budget: bigint;
    spent: bigint;
  };
  onSuccess?: () => void;
}

interface PaymentEntry {
  id: string;
  recipient: string;
  amount: string;
}

export function BatchPaymentModal({
  open,
  onOpenChange,
  pot,
  onSuccess,
}: BatchPaymentModalProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { id: "1", recipient: "", amount: "" },
  ]);
  const [showReallocation, setShowReallocation] = useState(false);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const addPayment = () => {
    setPayments([...payments, { id: Date.now().toString(), recipient: "", amount: "" }]);
  };

  const removePayment = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter((p) => p.id !== id));
    }
  };

  const updatePayment = (id: string, field: "recipient" | "amount", value: string) => {
    setPayments(payments.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const getTotalAmount = () => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validPayments = payments.filter(p => p.recipient.trim() && p.amount.trim());

    if (validPayments.length === 0) {
      toast.error("Validation Error", { description: "At least one valid payment is required" });
      return;
    }

    // Validate all addresses
    const invalidAddresses = validPayments.filter((p) => !isValidAddress(p.recipient));
    if (invalidAddresses.length > 0) {
      toast.error("Validation Error", {
        description: `Invalid recipient address: ${invalidAddresses[0].recipient}`,
      });
      return;
    }

    // Validate all amounts
    const invalidAmounts = validPayments.filter((p) => {
      const amount = parseFloat(p.amount);
      return isNaN(amount) || amount <= 0;
    });

    if (invalidAmounts.length > 0) {
      toast.error("Validation Error", {
        description: "All amounts must be greater than 0",
      });
      return;
    }

    try {
      // Convert to contract format
      const potId = stringToBytes32(pot.id);
      const recipients = validPayments.map((p) => p.recipient as `0x${string}`);
      const amounts = validPayments.map((p) => parseUSDC(p.amount));

      // Calculate total
      const totalWei = amounts.reduce((sum, amount) => sum + amount, 0n);

      // Check if payment exceeds available budget (client-side check)
      const available = pot.budget - pot.spent;
      if (totalWei > available) {
        setShowReallocation(true);
        toast.error("Insufficient Budget", {
          description: "Budget reallocation required for this batch payment",
        });
        return;
      }

      // Submit to contract
      writeContract({
        address: treasuryVaultAddress,
        ...treasuryContract,
        functionName: "submitPayment",
        args: [potId, recipients, amounts],
      });
    } catch (err) {
      toast.error("Transaction Error", {
        description: err instanceof Error ? err.message : "Failed to submit batch payment",
      });
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      const totalAmount = getTotalAmount();
      const requiresApproval = parseUSDC(totalAmount.toString()) > parseUSDC("50000");

      toast.success(
        requiresApproval ? "Batch Payment Pending Approval" : "Batch Payment Executed",
        {
          description: (
            <div className="space-y-1">
              <p>
                {requiresApproval
                  ? `Batch of ${payments.length} payments totaling ${formatUSDC(
                      parseUSDC(totalAmount.toString())
                    )} requires multi-sig approval`
                  : `Batch of ${payments.length} payments has been executed`}
              </p>
              <a
                href={getExplorerTxUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-xs block mt-1"
              >
                View on Explorer: {truncateTxHash(hash)}
              </a>
            </div>
          ),
        }
      );

      // Reset form
      setPayments([{ id: "1", recipient: "", amount: "" }]);
      reset();

      // Close modal and refresh data
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isConfirmed, hash, payments.length, onOpenChange, onSuccess, reset]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      const errorMessage = error.message;

      if (errorMessage.includes("Exceeds budget")) {
        setShowReallocation(true);
        toast.error("Budget Exceeded", {
          description: "This batch payment exceeds the available budget. Reallocate funds to proceed.",
        });
      } else if (errorMessage.includes("Not whitelisted")) {
        toast.error("Recipient Not Whitelisted", {
          description: "One or more recipients are not authorized to receive payments from this pot.",
        });
      } else {
        toast.error("Transaction Failed", {
          description: errorMessage,
        });
      }

      reset();
    }
  }, [error, reset]);

  const isSubmitting = isPending || isConfirming;
  const available = pot.budget - pot.spent;
  const totalAmount = getTotalAmount();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Payment from {pot.name}</DialogTitle>
            <DialogDescription>
              Submit multiple payments at once (e.g., payroll)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Payment Entries */}
              {payments.map((payment, index) => (
                <div key={payment.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`recipient-${payment.id}`}>
                      Recipient {index + 1}
                    </Label>
                    <Input
                      id={`recipient-${payment.id}`}
                      placeholder="0x..."
                      value={payment.recipient}
                      onChange={(e) => updatePayment(payment.id, "recipient", e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label htmlFor={`amount-${payment.id}`}>Amount</Label>
                    <Input
                      id={`amount-${payment.id}`}
                      type="number"
                      placeholder="0.00"
                      value={payment.amount}
                      onChange={(e) => updatePayment(payment.id, "amount", e.target.value)}
                      disabled={isSubmitting}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {payments.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8"
                      onClick={() => removePayment(payment.id)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Add Recipient Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPayment}
                className="w-full"
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Recipient
              </Button>

              {/* Summary */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Payment:</span>
                  <span className="font-bold text-financial">
                    ${totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-semibold text-financial">
                    {formatUSDC(available)}
                  </span>
                </div>
              </div>

              {/* Transaction Status */}
              {isConfirming && hash && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      Transaction confirming...
                    </p>
                  </div>
                  <a
                    href={getExplorerTxUrl(hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs mt-1 block"
                  >
                    View on Explorer: {truncateTxHash(hash)}
                  </a>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isPending ? "Confirming..." : "Submitting..."}
                  </>
                ) : (
                  `Submit ${payments.length} Payments`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ReallocationModal
        open={showReallocation}
        onOpenChange={setShowReallocation}
        targetPot={pot.id}
        shortfall={totalAmount}
        onSuccess={onSuccess}
      />
    </>
  );
}
