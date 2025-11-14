import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Users } from "lucide-react";
import { toast } from "sonner";

// Mock data - in real app, this would come from contract reads
const MOCK_PENDING_PAYMENTS = [
  {
    txHash: "0x1234...5678",
    potId: "marketing",
    potName: "Marketing",
    recipientCount: 1,
    approvalCount: 0,
    threshold: 2,
    totalAmount: 45000,
    timestamp: Date.now() - 3600000, // 1 hour ago
  },
  {
    txHash: "0xabcd...efgh",
    potId: "engineering",
    potName: "Engineering",
    recipientCount: 15,
    approvalCount: 1,
    threshold: 2,
    totalAmount: 180000,
    timestamp: Date.now() - 7200000, // 2 hours ago
  },
];

export function ApprovalQueue() {
  const handleApprove = async (txHash: string, potName: string) => {
    try {
      // Simulate contract call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Payment approved", {
        description: `Your approval for ${potName} payment has been recorded`,
      });
    } catch (error) {
      toast.error("Approval failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-4">
      {MOCK_PENDING_PAYMENTS.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No pending approvals</p>
            <p className="text-sm text-muted-foreground mt-1">
              All payments have been processed
            </p>
          </CardContent>
        </Card>
      ) : (
        MOCK_PENDING_PAYMENTS.map((payment) => (
          <Card key={payment.txHash} className="card-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{payment.potName} Payment</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimestamp(payment.timestamp)}</span>
                  </div>
                </div>
                <Badge variant={payment.recipientCount > 1 ? "secondary" : "default"}>
                  {payment.recipientCount > 1 ? "Batch Payment" : "Single Payment"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Recipients</span>
                  <p className="font-semibold">{payment.recipientCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Amount</span>
                  <p className="font-semibold text-financial">
                    ${payment.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Transaction Hash</span>
                  <p className="font-mono text-xs">{payment.txHash}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Approvals</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">
                      {payment.approvalCount} / {payment.threshold}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  onClick={() => handleApprove(payment.txHash, payment.potName)}
                  className="w-full"
                  disabled={payment.approvalCount >= payment.threshold}
                >
                  {payment.approvalCount >= payment.threshold ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Fully Approved
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve Payment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
