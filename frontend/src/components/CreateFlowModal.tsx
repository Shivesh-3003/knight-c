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
import { Loader2, Plus, X } from "lucide-react";
import { useFlowStore, Recipient, Flow } from "@/stores/flowStore";
import { isValidAddress } from "@/lib/utils";

interface CreateFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowToEdit: Flow | null;
}

interface PaymentEntry {
  id: string;
  walletAddress: string;
  amount: string;
}

export function CreateFlowModal({ open, onOpenChange, flowToEdit }: CreateFlowModalProps) {
  const { addFlow, updateFlow } = useFlowStore();
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [nextRun, setNextRun] = useState("");
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { id: "1", walletAddress: "", amount: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = flowToEdit !== null;

  useEffect(() => {
    if (isEditMode) {
      setName(flowToEdit.name);
      setFrequency(flowToEdit.frequency);
      setNextRun(flowToEdit.nextRun);
      setPayments(
        flowToEdit.recipients.map((r, i) => ({
          id: `recipient-${i}`,
          walletAddress: r.walletAddress,
          amount: r.amount.toString(),
        }))
      );
    } else {
      // Reset form for new flow
      setName("");
      setFrequency("");
      setNextRun("");
      setPayments([{ id: "1", walletAddress: "", amount: "" }]);
    }
  }, [flowToEdit, isEditMode, open]);

  const addPayment = () => {
    setPayments([...payments, { id: Date.now().toString(), walletAddress: "", amount: "" }]);
  };

  const removePayment = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter((p) => p.id !== id));
    }
  };

  const updatePayment = (id: string, field: "walletAddress" | "amount", value: string) => {
    setPayments(payments.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const getTotalAmount = () => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!name.trim() || !frequency.trim() || !nextRun.trim()) {
      toast.error("Validation Error", { description: "Please fill in all flow details." });
      setIsSubmitting(false);
      return;
    }

    const validPayments = payments.filter(p => p.walletAddress.trim() && p.amount.trim());
    if (validPayments.length === 0) {
      toast.error("Validation Error", { description: "At least one valid recipient is required." });
      setIsSubmitting(false);
      return;
    }

    const invalidAddresses = validPayments.filter((p) => !isValidAddress(p.walletAddress));
    if (invalidAddresses.length > 0) {
      toast.error("Validation Error", { description: `Invalid recipient address: ${invalidAddresses[0].walletAddress}` });
      setIsSubmitting(false);
      return;
    }

    const recipients: Recipient[] = validPayments.map(p => ({
      walletAddress: p.walletAddress,
      amount: parseFloat(p.amount)
    }));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const flowData = { name, frequency, nextRun, recipients };

    if (isEditMode) {
      updateFlow(flowToEdit.id, flowData);
      toast.success("Flow Updated!", { description: "The scheduled flow has been updated." });
    } else {
      addFlow(flowData);
      toast.success("Flow Created!", { description: "Your new scheduled flow has been configured." });
    }
    
    onOpenChange(false);
    setIsSubmitting(false);
  };

  const totalAmount = getTotalAmount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Flow" : "Create New Flow"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Edit the details of your automated recurring payment flow."
              : "Configure a new automated recurring payment flow."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Flow Name</Label>
            <Input id="name" placeholder="e.g., Bi-weekly Payroll" value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Input id="frequency" placeholder="e.g., Every 2 weeks" value={frequency} onChange={(e) => setFrequency(e.target.value)} disabled={isSubmitting} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextRun">Next Run Date</Label>
              <Input id="nextRun" type="date" value={nextRun} onChange={(e) => setNextRun(e.target.value)} disabled={isSubmitting} required />
            </div>
          </div>

          <div className="space-y-4 py-4">
            <Label>Recipients</Label>
            {payments.map((payment, index) => (
              <div key={payment.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`recipient-${payment.id}`} className="sr-only">Recipient {index + 1}</Label>
                  <Input id={`recipient-${payment.id}`} placeholder="0x..." value={payment.walletAddress} onChange={(e) => updatePayment(payment.id, "walletAddress", e.target.value)} disabled={isSubmitting} required />
                </div>
                <div className="w-32 space-y-2">
                  <Label htmlFor={`amount-${payment.id}`} className="sr-only">Amount</Label>
                  <Input id={`amount-${payment.id}`} type="number" placeholder="0.00" value={payment.amount} onChange={(e) => updatePayment(payment.id, "amount", e.target.value)} disabled={isSubmitting} required min="0" step="0.01" />
                </div>
                {payments.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="mt-2" onClick={() => removePayment(payment.id)} disabled={isSubmitting}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPayment} className="w-full" disabled={isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recipient
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Payment:</span>
              <span className="font-bold text-financial">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Recipients:</span>
              <span className="font-semibold">{payments.length}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Saving Changes..." : "Creating Flow..."}
                </>
              ) : (
                isEditMode ? "Save Changes" : "Create Flow"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
