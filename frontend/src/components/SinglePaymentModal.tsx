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
import { ReallocationModal } from "@/components/ReallocationModal";

interface SinglePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pot: {
    id: string;
    name: string;
    budget: number;
    spent: number;
  };
}

export function SinglePaymentModal({ open, onOpenChange, pot }: SinglePaymentModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReallocation, setShowReallocation] = useState(false);
  const [shortfall, setShortfall] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const paymentAmount = parseFloat(amount);
      const available = pot.budget - pot.spent;

      // Simulate contract call - check if exceeds budget
      if (paymentAmount > available) {
        // Trigger reallocation modal
        setShortfall(paymentAmount);
        setShowReallocation(true);
        toast.error("Insufficient budget", {
          description: "Budget reallocation required for this payment",
        });
      } else {
        // Simulate successful submission
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        toast.success("Payment submitted", {
          description: `Payment of $${paymentAmount.toLocaleString()} to ${recipient} is pending approval`,
        });
        
        onOpenChange(false);
        setRecipient("");
        setAmount("");
      }
    } catch (error) {
      toast.error("Payment failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-semibold text-financial">
                    ${(pot.budget - pot.spent).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ReallocationModal
        open={showReallocation}
        onOpenChange={setShowReallocation}
        targetPot={pot.id}
        shortfall={shortfall}
      />
    </>
  );
}
