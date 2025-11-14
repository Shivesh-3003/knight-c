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
import { Plus, X } from "lucide-react";
import { ReallocationModal } from "@/components/ReallocationModal";

interface BatchPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pot: {
    id: string;
    name: string;
    budget: number;
    spent: number;
  };
}

interface PaymentEntry {
  id: string;
  recipient: string;
  amount: string;
}

export function BatchPaymentModal({ open, onOpenChange, pot }: BatchPaymentModalProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { id: "1", recipient: "", amount: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReallocation, setShowReallocation] = useState(false);
  const [shortfall, setShortfall] = useState(0);

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
    setIsSubmitting(true);

    try {
      const totalAmount = getTotalAmount();
      const available = pot.budget - pot.spent;

      // Simulate contract call - check if exceeds budget
      if (totalAmount > available) {
        // Trigger reallocation modal
        setShortfall(totalAmount);
        setShowReallocation(true);
        toast.error("Insufficient budget", {
          description: "Budget reallocation required for this batch payment",
        });
      } else {
        // Simulate successful submission
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        toast.success("Batch payment submitted", {
          description: `Batch of ${payments.length} payments totaling $${totalAmount.toLocaleString()} is pending approval`,
        });
        
        onOpenChange(false);
        setPayments([{ id: "1", recipient: "", amount: "" }]);
      }
    } catch (error) {
      toast.error("Batch payment failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPayment}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Recipient
              </Button>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Payment:</span>
                  <span className="font-bold text-financial">
                    ${getTotalAmount().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
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
                {isSubmitting ? "Submitting..." : `Submit ${payments.length} Payments`}
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
