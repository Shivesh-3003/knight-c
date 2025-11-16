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
import { Loader2 } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { treasuryContract } from "@/lib/wagmi";
import { treasuryVaultAddress } from "@/lib/contract";
import { stringToBytes32, parseUSDC, formatUSDC, getExplorerTxUrl, truncateTxHash } from "@/lib/utils";

interface EditPotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pot: {
    id: string;
    name: string;
    budget: bigint;
    spent: bigint;
    threshold: bigint;
  };
  onSuccess?: () => void;
}

export function EditPotModal({
  open,
  onOpenChange,
  pot,
  onSuccess,
}: EditPotModalProps) {
  const [newBudget, setNewBudget] = useState("");
  const [newThreshold, setNewThreshold] = useState("");

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Initialize form values when pot changes
  useEffect(() => {
    if (open) {
      // Convert from wei (6 decimals) to USDC
      const budgetUSDC = Number(pot.budget) / 1_000_000;
      const thresholdUSDC = Number(pot.threshold) / 1_000_000;
      setNewBudget(budgetUSDC.toString());
      setNewThreshold(thresholdUSDC.toString());
    }
  }, [open, pot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const budgetValue = parseFloat(newBudget);
    const thresholdValue = parseFloat(newThreshold);

    if (isNaN(budgetValue) || budgetValue <= 0) {
      toast.error("Validation Error", { description: "Budget must be greater than 0" });
      return;
    }

    if (isNaN(thresholdValue) || thresholdValue < 0) {
      toast.error("Validation Error", { description: "Threshold must be 0 or greater" });
      return;
    }

    // Check that new budget is at least as much as already spent
    const spentUSDC = Number(pot.spent) / 1_000_000;
    if (budgetValue < spentUSDC) {
      toast.error("Validation Error", {
        description: `Budget cannot be less than already spent ($${spentUSDC.toFixed(2)})`,
      });
      return;
    }

    try {
      // Convert to contract format
      const potId = stringToBytes32(pot.id);
      const budgetWei = parseUSDC(newBudget);
      const thresholdWei = parseUSDC(newThreshold);

      // Submit to contract
      writeContract({
        address: treasuryVaultAddress,
        ...treasuryContract,
        functionName: "updatePot",
        args: [potId, budgetWei, thresholdWei],
      });
    } catch (err) {
      toast.error("Transaction Error", {
        description: err instanceof Error ? err.message : "Failed to update pot",
      });
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Pot Updated", {
        description: (
          <div className="space-y-1">
            <p>{pot.name} budget and threshold have been updated</p>
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
      });

      // Reset and close
      reset();
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isConfirmed, hash, pot.name, onOpenChange, onSuccess, reset]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast.error("Transaction Failed", {
        description: error.message,
      });
      reset();
    }
  }, [error, reset]);

  const isSubmitting = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {pot.name} Pot</DialogTitle>
          <DialogDescription>
            Update budget allocation and approval threshold
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Current Values Display */}
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Budget:</span>
                <span className="font-semibold text-financial">
                  {formatUSDC(pot.budget)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Already Spent:</span>
                <span className="font-semibold text-financial">
                  {formatUSDC(pot.spent)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Threshold:</span>
                <span className="font-semibold text-financial">
                  {formatUSDC(pot.threshold)}
                </span>
              </div>
            </div>

            {/* New Budget Input */}
            <div className="space-y-2">
              <Label htmlFor="newBudget">New Budget (USDC)</Label>
              <Input
                id="newBudget"
                type="number"
                placeholder="0.00"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                disabled={isSubmitting}
                required
                min={Number(pot.spent) / 1_000_000}
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least ${(Number(pot.spent) / 1_000_000).toFixed(2)} (amount already spent)
              </p>
            </div>

            {/* New Threshold Input */}
            <div className="space-y-2">
              <Label htmlFor="newThreshold">New Approval Threshold (USDC)</Label>
              <Input
                id="newThreshold"
                type="number"
                placeholder="0.00"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                disabled={isSubmitting}
                required
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Payments above this amount will require CFO approval
              </p>
            </div>

            {/* Transaction Status */}
            {isConfirming && hash && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Updating pot...
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
                  {isPending ? "Confirming..." : "Updating..."}
                </>
              ) : (
                "Update Pot"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
