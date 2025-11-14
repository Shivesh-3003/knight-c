import { ApprovalQueue } from "@/components/ApprovalQueue";

export default function Approvals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Approvals</h1>
        <p className="mt-2 text-muted-foreground">
          Review and approve pending payments that require multi-signature authorization
        </p>
      </div>
      <ApprovalQueue />
    </div>
  );
}
