import { ApprovalQueue } from "@/components/ApprovalQueue";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertCircle } from "lucide-react";

export default function Approvals() {
  const { roleInfo } = useUserRole();
  const canApprove = roleInfo.permissions.approvePayments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Approvals</h1>
        <p className="mt-2 text-muted-foreground">
          Review and approve pending payments that require multi-signature authorization
        </p>
      </div>

      {!canApprove && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="h-5 w-5" />
              View Only Access
            </CardTitle>
            <CardDescription className="text-yellow-800">
              You are logged in as <strong>{roleInfo.label}</strong>. Only the CFO can approve payments.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <ApprovalQueue />
    </div>
  );
}
