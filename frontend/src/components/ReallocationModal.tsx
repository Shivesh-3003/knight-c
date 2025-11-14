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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ReallocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPot: string;
  shortfall: number;
}

// Mock data for other pots - in real app, this would come from contract reads
const ALL_POTS = [
  { id: "engineering", name: "Engineering", budget: 2000000, spent: 1200000 },
  { id: "marketing", name: "Marketing", budget: 500000, spent: 380000 },
  { id: "operations", name: "Operations", budget: 800000, spent: 450000 },
];

export function ReallocationModal({
  open,
  onOpenChange,
  targetPot,
  shortfall,
}: ReallocationModalProps) {
  const [sourcePot, setSourcePot] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available pots (excluding target pot)
  const availablePots = ALL_POTS.filter((pot) => {
    if (pot.id === targetPot) return false;
    const available = pot.budget - pot.spent;
    return available >= shortfall;
  });

  const selectedPotData = availablePots.find((p) => p.id === sourcePot);

  const handleReallocate = async () => {
    if (!sourcePot) return;

    setIsSubmitting(true);

    try {
      // Simulate contract call to reallocate
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Budget reallocated", {
        description: `$${shortfall.toLocaleString()} moved from ${
          selectedPotData?.name
        } to ${ALL_POTS.find((p) => p.id === targetPot)?.name}`,
      });

      onOpenChange(false);
      setSourcePot("");
    } catch (error) {
      toast.error("Reallocation failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Budget Reallocation Required</DialogTitle>
          <DialogDescription>
            The {ALL_POTS.find((p) => p.id === targetPot)?.name} budget needs additional
            funds to complete this payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Shortfall: <span className="font-bold text-financial">${shortfall.toLocaleString()}</span>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="source-pot">Reallocate From</Label>
            <Select value={sourcePot} onValueChange={setSourcePot}>
              <SelectTrigger id="source-pot">
                <SelectValue placeholder="Select source budget" />
              </SelectTrigger>
              <SelectContent>
                {availablePots.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No budgets have sufficient funds
                  </div>
                ) : (
                  availablePots.map((pot) => {
                    const available = pot.budget - pot.spent;
                    return (
                      <SelectItem key={pot.id} value={pot.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{pot.name}</span>
                          <span className="ml-4 text-xs text-muted-foreground text-financial">
                            ${available.toLocaleString()} available
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedPotData && (
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Available:</span>
                <span className="font-semibold text-financial">
                  ${(selectedPotData.budget - selectedPotData.spent).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">After Reallocation:</span>
                <span className="font-semibold text-financial">
                  ${(selectedPotData.budget - selectedPotData.spent - shortfall).toLocaleString()}
                </span>
              </div>
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
          <Button
            onClick={handleReallocate}
            disabled={!sourcePot || isSubmitting || availablePots.length === 0}
          >
            {isSubmitting ? "Reallocating..." : "Approve Reallocation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
