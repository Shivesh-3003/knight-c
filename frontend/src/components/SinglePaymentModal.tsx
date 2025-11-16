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
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ReallocationModal } from "@/components/ReallocationModal";
import { treasuryContract } from "@/lib/wagmi";
import { treasuryVaultAddress } from "@/lib/contract";
import { useUserRole } from "@/hooks/useUserRole";
import {
  stringToBytes32,
  parseUSDC,
  formatUSDC,
  isValidAddress,
  getExplorerTxUrl,
  truncateTxHash,
} from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SinglePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pot: {
    id: string;
    name: string;
    budget: bigint;
    spent: bigint;
    threshold: bigint;
  };
  treasuryBalance?: bigint;
  onSuccess?: () => void;
}

export function SinglePaymentModal({
  open,
  onOpenChange,
  pot,
  treasuryBalance,
  onSuccess,
}: SinglePaymentModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [showReallocation, setShowReallocation] = useState(false);

  const { role } = useUserRole();
  const isCfo = role === "cfo";

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isValidAddress(recipient)) {
      toast.error("Validation Error", { description: "Invalid recipient address" });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Validation Error", { description: "Amount must be greater than 0" });
      return;
    }

    try {
      // Convert to contract format
      const potId = stringToBytes32(pot.id);
      const amountWei = parseUSDC(amount);

      // Check if payment exceeds available treasury balance (client-side check)
      const available = treasuryBalance || 0n;
      if (amountWei > available) {
        toast.error("Insufficient Treasury Balance", {
          description: "The treasury does not have enough USDC for this payment",
        });
        return;
      }

      // Submit to contract
      writeContract({
        address: treasuryVaultAddress,
        ...treasuryContract,
        functionName: "submitPayment",
        args: [potId, [recipient as `0x${string}`], [amountWei]],
      });
    } catch (err) {
      toast.error("Transaction Error", {
        description: err instanceof Error ? err.message : "Failed to submit payment",
      });
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      const available = pot.budget - pot.spent;
      const amountWei = parseUSDC(amount);

      // Determine if payment requires approval based on pot's threshold
      // CFO bypasses approval regardless of amount
      const requiresApproval = amountWei > pot.threshold && !isCfo;

      toast.success(
        requiresApproval ? "Payment Pending Approval" : "Payment Executed",
        {
          description: (
            <div className="space-y-1">
              <p>
                {requiresApproval
                  ? `Payment of ${formatUSDC(amountWei)} requires multi-sig approval`
                  : `Payment of ${formatUSDC(amountWei)} has been executed`}
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
      setRecipient("");
      setAmount("");
      reset();

      // Close modal and refresh data
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isConfirmed, hash, amount, pot.budget, pot.spent, pot.threshold, isCfo, onOpenChange, onSuccess, reset]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      const errorMessage = error.message;

      // Check for specific contract errors
      if (errorMessage.includes("Exceeds budget")) {
        setShowReallocation(true);
        toast.error("Budget Exceeded", {
          description: "This payment exceeds the available budget. Reallocate funds to proceed.",
        });
      } else if (errorMessage.includes("Not whitelisted")) {
        toast.error("Recipient Not Whitelisted", {
          description: "This recipient is not authorized to receive payments from this pot.",
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
  const available = treasuryBalance || 0n;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Payment from {pot.name}</DialogTitle>
            <DialogDescription>
              Submit a single payment from the {pot.name} budget
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Recipient Address */}
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Available Treasury Balance */}
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Treasury Balance Available:</span>
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
                  "Submit Payment"
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
        shortfall={parseFloat(amount) || 0}
        onSuccess={onSuccess}
      />
    </>
  );
}
