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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { treasuryContract } from "@/lib/wagmi";
import { treasuryVaultAddress } from "@/lib/contract";
import { POT_IDS, POT_NAMES } from "@/lib/constants";
import { stringToBytes32, parseUSDC, formatUSDC, getExplorerTxUrl, truncateTxHash } from "@/lib/utils";

interface ReallocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPot: string;
  shortfall: number; // in regular number format
  onSuccess?: () => void;
}

interface PotData {
  id: string;
  name: string;
  budget: bigint;
  spent: bigint;
  available: bigint;
}

export function ReallocationModal({
  open,
  onOpenChange,
  targetPot,
  shortfall,
  onSuccess,
}: ReallocationModalProps) {
  const [sourcePot, setSourcePot] = useState<string>("");
  const [pots, setPots] = useState<PotData[]>([]);

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read all pot details
  const { data: potsData, isLoading: isLoadingPots } = useReadContracts({
    contracts: POT_IDS.map((potId) => ({
      address: treasuryVaultAddress,
      ...treasuryContract,
      functionName: "getPotDetails",
      args: [stringToBytes32(potId)],
    })),
  });

  // Process pot data
  useEffect(() => {
    if (potsData) {
      const processedPots: PotData[] = POT_IDS.map((potId, index) => {
        const potData = potsData[index];
        const budget = potData?.status === "success" ? (potData.result as [bigint, bigint, bigint])[0] : 0n;
        const spent = potData?.status === "success" ? (potData.result as [bigint, bigint, bigint])[1] : 0n;
        const available = budget - spent;

        return {
          id: potId,
          name: POT_NAMES[potId],
          budget,
          spent,
          available,
        };
      });

      setPots(processedPots);
    }
  }, [potsData]);

  // Filter available pots (excluding target pot and pots without enough funds)
  const shortfallWei = parseUSDC(shortfall.toString());
  const availablePots = pots.filter((pot) => {
    if (pot.id === targetPot) return false;
    return pot.available >= shortfallWei;
  });

  const selectedPotData = pots.find((p) => p.id === sourcePot);
  const targetPotData = pots.find((p) => p.id === targetPot);

  // Handle reallocation
  const handleReallocate = async () => {
    if (!sourcePot) return;

    try {
      writeContract({
        address: treasuryVaultAddress,
        ...treasuryContract,
        functionName: "reallocate",
        args: [
          stringToBytes32(sourcePot),
          stringToBytes32(targetPot),
          shortfallWei,
        ],
      });
    } catch (err) {
      toast.error("Reallocation Failed", {
        description: err instanceof Error ? err.message : "Failed to reallocate budget",
      });
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Budget Reallocated", {
        description: (
          <div className="space-y-1">
            <p>
              {formatUSDC(shortfallWei)} moved from {selectedPotData?.name} to {targetPotData?.name}
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
      });

      // Reset and close
      setSourcePot("");
      reset();
      onOpenChange(false);
      onSuccess?.();
    }
  }, [isConfirmed, hash, shortfallWei, selectedPotData, targetPotData, onOpenChange, onSuccess, reset]);

  // Handle transaction error
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message;

      if (errorMessage.includes("Insufficient")) {
        toast.error("Insufficient Funds", {
          description: "The source pot does not have enough available budget",
        });
      } else if (errorMessage.includes("Only CFO")) {
        toast.error("Not Authorized", {
          description: "Only the CFO can reallocate budgets",
        });
      } else {
        toast.error("Reallocation Failed", {
          description: errorMessage,
        });
      }

      reset();
    }
  }, [writeError, reset]);

  const isSubmitting = isPending || isConfirming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Budget Reallocation Required</DialogTitle>
          <DialogDescription>
            The {targetPotData?.name || targetPot} budget needs additional
            funds to complete this payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Shortfall:{" "}
              <span className="font-bold text-financial">
                ${shortfall.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </AlertDescription>
          </Alert>

          {isLoadingPots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="source-pot">Reallocate From</Label>
                <Select value={sourcePot} onValueChange={setSourcePot} disabled={isSubmitting}>
                  <SelectTrigger id="source-pot">
                    <SelectValue placeholder="Select source budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePots.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No budgets have sufficient funds
                      </div>
                    ) : (
                      availablePots.map((pot) => (
                        <SelectItem key={pot.id} value={pot.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{pot.name}</span>
                            <span className="ml-4 text-xs text-muted-foreground text-financial">
                              {formatUSDC(pot.available)} available
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedPotData && (
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Available:</span>
                    <span className="font-semibold text-financial">
                      {formatUSDC(selectedPotData.available)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After Reallocation:</span>
                    <span className="font-semibold text-financial">
                      {formatUSDC(selectedPotData.available - shortfallWei)}
                    </span>
                  </div>
                </div>
              )}

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
            </>
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
          <Button
            onClick={handleReallocate}
            disabled={!sourcePot || isSubmitting || availablePots.length === 0 || isLoadingPots}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPending ? "Confirming..." : "Reallocating..."}
              </>
            ) : (
              "Approve Reallocation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
