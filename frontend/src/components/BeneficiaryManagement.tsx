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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, Plus, Loader2 } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { treasuryContract } from "@/lib/wagmi";
import { treasuryVaultAddress } from "@/lib/contract";
import { stringToBytes32, isValidAddress, getExplorerTxUrl, truncateTxHash } from "@/lib/utils";

interface BeneficiaryManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  potId: string;
  potName: string;
}

// Pre-populated demo addresses from .env
const DEMO_ADDRESSES = {
  CFO: import.meta.env.VITE_CFO_ADDRESS as string,
  VP: import.meta.env.VITE_VP_ADDRESS as string,
  Employee: import.meta.env.VITE_EMPLOYEE_ADDRESS as string,
};

export function BeneficiaryManagement({
  open,
  onOpenChange,
  potId,
  potName,
}: BeneficiaryManagementProps) {
  const [newAddress, setNewAddress] = useState("");
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<string[]>([
    DEMO_ADDRESSES.CFO,
    DEMO_ADDRESSES.VP,
    DEMO_ADDRESSES.Employee,
  ]);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isValidAddress(newAddress)) {
      toast.error("Validation Error", { description: "Invalid address format" });
      return;
    }

    // Check if already in list (case-insensitive)
    if (whitelistedAddresses.some(addr => addr.toLowerCase() === newAddress.toLowerCase())) {
      toast.error("Already Whitelisted", { description: "This address is already in the whitelist" });
      return;
    }

    try {
      // Call contract
      writeContract({
        address: treasuryVaultAddress,
        ...treasuryContract,
        functionName: "addBeneficiary",
        args: [stringToBytes32(potId), newAddress as `0x${string}`],
      });
    } catch (err) {
      toast.error("Transaction Error", {
        description: err instanceof Error ? err.message : "Failed to add beneficiary",
      });
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Beneficiary Added", {
        description: (
          <div className="space-y-1">
            <p>Address has been whitelisted for {potName}</p>
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

      // Add to local list
      setWhitelistedAddresses([...whitelistedAddresses, newAddress]);
      setNewAddress("");
      reset();
    }
  }, [isConfirmed, hash, newAddress, whitelistedAddresses, potName, reset]);

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
          <DialogTitle>Manage Beneficiaries - {potName}</DialogTitle>
          <DialogDescription>
            Add authorized payment recipients for this department
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Whitelisted Addresses */}
          <div className="space-y-2">
            <Label>Whitelisted Addresses</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {whitelistedAddresses.map((address, index) => {
                // Determine label
                let label = "Address";
                if (address.toLowerCase() === DEMO_ADDRESSES.CFO.toLowerCase()) label = "CFO";
                else if (address.toLowerCase() === DEMO_ADDRESSES.VP.toLowerCase()) label = "VP";
                else if (address.toLowerCase() === DEMO_ADDRESSES.Employee.toLowerCase()) label = "Employee";

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-success" />
                      <span className="text-sm font-mono text-muted-foreground">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Beneficiary Form */}
          <form onSubmit={handleAddBeneficiary} className="space-y-2">
            <Label htmlFor="newAddress">Add New Beneficiary</Label>
            <div className="flex gap-2">
              <Input
                id="newAddress"
                placeholder="0x..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting} size="sm">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Transaction Status */}
          {isConfirming && hash && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Adding beneficiary...
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
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
