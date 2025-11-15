import { useState } from "react";
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
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { treasuryContract } from "@/lib/wagmi";
import { treasuryVaultAddress } from "@/lib/contract";
import { stringToBytes32, parseUSDC, isValidAddress, getExplorerTxUrl, truncateTxHash } from "@/lib/utils";
import { DEFAULT_APPROVAL_THRESHOLD } from "@/lib/constants";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface CreatePotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePotModal({ open, onOpenChange, onSuccess }: CreatePotModalProps) {
  const [potName, setPotName] = useState("");
  const [budget, setBudget] = useState("");
  const [approvers, setApprovers] = useState<string[]>([""]);
  const [threshold, setThreshold] = useState(DEFAULT_APPROVAL_THRESHOLD.toString());

  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!potName.trim()) {
      toast.error("Validation Error", { description: "Pot name is required" });
      return;
    }

    const budgetAmount = parseFloat(budget);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      toast.error("Validation Error", { description: "Budget must be greater than 0" });
      return;
    }

    const thresholdAmount = parseFloat(threshold);
    if (isNaN(thresholdAmount) || thresholdAmount < 0) {
      toast.error("Validation Error", { description: "Threshold must be a valid number" });
      return;
    }

    // Filter out empty approvers and validate addresses
    const validApprovers = approvers.filter((addr) => addr.trim() !== "");

    if (validApprovers.length === 0) {
      toast.error("Validation Error", { description: "At least one approver is required" });
      return;
    }

    const invalidApprovers = validApprovers.filter((addr) => !isValidAddress(addr));
    if (invalidApprovers.length > 0) {
      toast.error("Validation Error", {
        description: `Invalid approver address: ${invalidApprovers[0]}`,
      });
      return;
    }

    try {
      // Convert to contract format
      const potId = stringToBytes32(potName.toLowerCase().replace(/\s+/g, "-"));
      const budgetWei = parseUSDC(budget);
      const thresholdWei = parseUSDC(threshold);

      // Submit to contract
      writeContract({
        address: treasuryVaultAddress,
        ...treasuryContract,
        functionName: "createPot",
        args: [potId, budgetWei, validApprovers as `0x${string}`[], thresholdWei],
      });
    } catch (err) {
      toast.error("Transaction Error", {
        description: err instanceof Error ? err.message : "Failed to create pot",
      });
    }
  };

  // Handle transaction confirmation
  if (isConfirmed && hash) {
    toast.success("Pot Created!", {
      description: (
        <div className="space-y-1">
          <p>Department budget has been created successfully</p>
          <a
            href={getExplorerTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs"
          >
            View on Explorer: {truncateTxHash(hash)}
          </a>
        </div>
      ),
    });

    // Reset form
    setPotName("");
    setBudget("");
    setApprovers([""]);
    setThreshold(DEFAULT_APPROVAL_THRESHOLD.toString());

    // Close modal and refresh data
    onOpenChange(false);
    onSuccess?.();
  }

  // Handle transaction error
  if (error) {
    toast.error("Transaction Failed", {
      description: error.message.includes("Pot exists")
        ? "A pot with this name already exists"
        : error.message,
    });
  }

  // Add approver field
  const handleAddApprover = () => {
    setApprovers([...approvers, ""]);
  };

  // Remove approver field
  const handleRemoveApprover = (index: number) => {
    if (approvers.length > 1) {
      setApprovers(approvers.filter((_, i) => i !== index));
    }
  };

  // Update approver address
  const handleApproverChange = (index: number, value: string) => {
    const updated = [...approvers];
    updated[index] = value;
    setApprovers(updated);
  };

  const isSubmitting = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Department Budget (Pot)</DialogTitle>
          <DialogDescription>
            Set up a new department budget with approvers and spending threshold
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pot Name */}
          <div className="space-y-2">
            <Label htmlFor="potName">Department Name</Label>
            <Input
              id="potName"
              placeholder="e.g., Engineering, Marketing, Operations"
              value={potName}
              onChange={(e) => setPotName(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be converted to a unique pot ID (e.g., "engineering")
            </p>
          </div>

          {/* Budget Amount */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Amount (USDC)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              placeholder="1000000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Total budget allocated to this department
            </p>
          </div>

          {/* Approval Threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold">Approval Threshold (USDC)</Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              min="0"
              placeholder="50000"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Payments above this amount require multi-sig approval
            </p>
          </div>

          {/* Approvers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Approvers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddApprover}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Approver
              </Button>
            </div>

            <div className="space-y-2">
              {approvers.map((approver, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="0x..."
                    value={approver}
                    onChange={(e) => handleApproverChange(index, e.target.value)}
                    disabled={isSubmitting}
                  />
                  {approvers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveApprover(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Wallet addresses authorized to approve high-value payments
            </p>
          </div>

          {/* Info Notice */}
          {!address && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                ⚠️ Please connect your wallet to create a pot
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !address}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? "Confirming..." : "Creating Pot..."}
                </>
              ) : (
                "Create Pot"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
