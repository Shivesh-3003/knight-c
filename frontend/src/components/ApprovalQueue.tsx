import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Clock, Users, Loader2, ExternalLink, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect, useMemo } from "react";
import { treasuryContract } from "@/lib/wagmi";
import { treasuryVaultAddress } from "@/lib/contract";
import { POT_NAMES } from "@/lib/constants";
import { formatUSDC, getExplorerTxUrl, truncateTxHash } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

interface PendingPayment {
  txHash: string;
  potId: string;
  potName: string;
  recipientCount: number;
  approvalCount: bigint;
  totalAmount: bigint;
  executed: boolean;
}

const MAX_QUEUE_SIZE = 20; // Read up to 20 pending payments

export function ApprovalQueue() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingTxHash, setApprovingTxHash] = useState<string | null>(null);

  const { roleInfo } = useUserRole();
  const canApprove = roleInfo.permissions.approvePayments;

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read pending queue indices (try to read indices 0-19)
  const { data: queueData, refetch: refetchQueue, isLoading: isLoadingQueue } = useReadContracts({
    contracts: Array.from({ length: MAX_QUEUE_SIZE }, (_, i) => ({
      address: treasuryVaultAddress,
      ...treasuryContract,
      functionName: "pendingQueue",
      args: [BigInt(i)],
    })),
  });

  // Extract valid tx hashes from queue (memoized to prevent infinite loop)
  const validTxHashes = useMemo(() => {
    const hashes = queueData
      ?.map((item) => item.result as `0x${string}` | undefined)
      .filter((hash) => hash && hash !== "0x0000000000000000000000000000000000000000000000000000000000000000")
      .slice(0, 10) || []; // Limit to 10 for display

    console.log("[ApprovalQueue] Valid tx hashes from queue:", hashes);
    return hashes;
  }, [queueData]);

  // Read pending payment details for each hash
  const { data: pendingDetails, isLoading: isLoadingDetails } = useReadContracts({
    contracts: validTxHashes.map((txHash) => ({
      address: treasuryVaultAddress,
      ...treasuryContract,
      functionName: "getPendingDetails",
      args: [txHash as `0x${string}`],
    })),
  });

  // Process pending payments
  useEffect(() => {
    console.log("[ApprovalQueue] Processing pending details:", {
      pendingDetails,
      validTxHashesLength: validTxHashes.length,
      isLoadingDetails
    });

    if (pendingDetails && validTxHashes.length > 0) {
      const payments: PendingPayment[] = [];

      pendingDetails.forEach((detail, index) => {
        console.log(`[ApprovalQueue] Detail ${index}:`, detail);

        if (detail.status === "success" && detail.result) {
          const [potId, recipients, amounts, approvalCount, executed] = detail.result as [
            `0x${string}`,
            `0x${string}`[],
            bigint[],
            bigint,
            boolean
          ];

          console.log(`[ApprovalQueue] Pending payment ${index}:`, {
            potId,
            recipients,
            amounts,
            approvalCount,
            executed
          });

          // Skip executed payments
          if (executed) {
            console.log(`[ApprovalQueue] Skipping executed payment ${index}`);
            return;
          }

          // Convert potId bytes32 to string
          const potIdStr = new TextDecoder()
            .decode(
              new Uint8Array(
                potId.slice(2).match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
              )
            )
            .replace(/\0/g, "")
            .trim();

          // Calculate total amount
          const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0n);

          // Map to pot name
          const potName = POT_NAMES[potIdStr as keyof typeof POT_NAMES] || potIdStr;

          payments.push({
            txHash: validTxHashes[index],
            potId: potIdStr,
            potName,
            recipientCount: recipients.length,
            approvalCount,
            totalAmount,
            executed,
          });
        }
      });

      console.log("[ApprovalQueue] Final payments array:", payments);
      setPendingPayments(payments);
      setIsLoading(false);
    } else if (validTxHashes.length === 0 && !isLoadingDetails && !isLoadingQueue) {
      console.log("[ApprovalQueue] No pending payments in queue");
      setPendingPayments([]);
      setIsLoading(false);
    } else {
      setIsLoading(isLoadingDetails || isLoadingQueue);
    }
  }, [pendingDetails, validTxHashes, isLoadingDetails, isLoadingQueue]);

  // Handle approval
  const handleApprove = async (txHash: string, potName: string) => {
    try {
      setApprovingTxHash(txHash);
      writeContract({
        address: treasuryVaultAddress,
        ...treasuryContract,
        functionName: "approvePayment",
        args: [txHash as `0x${string}`],
      });
    } catch (err) {
      toast.error("Approval Failed", {
        description: err instanceof Error ? err.message : "Failed to approve payment",
      });
      setApprovingTxHash(null);
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash && approvingTxHash) {
      toast.success("Payment Approved", {
        description: (
          <div className="space-y-1">
            <p>Your approval has been recorded successfully</p>
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

      // Refresh queue
      refetchQueue();
      setApprovingTxHash(null);
      reset();
    }
  }, [isConfirmed, hash, approvingTxHash, refetchQueue, reset]);

  // Handle transaction error
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message;

      if (errorMessage.includes("Already approved")) {
        toast.error("Already Approved", {
          description: "You have already approved this payment",
        });
      } else if (errorMessage.includes("Not approver")) {
        toast.error("Not Authorized", {
          description: "You are not authorized to approve this payment",
        });
      } else {
        toast.error("Approval Failed", {
          description: errorMessage,
        });
      }

      setApprovingTxHash(null);
      reset();
    }
  }, [writeError, reset]);

  const formatTimestamp = (txHash: string) => {
    // In a real app, you'd extract timestamp from transaction or store it
    // For now, we'll show a placeholder
    return "Recently";
  };

  const isApproving = (txHash: string) => {
    return approvingTxHash === txHash && (isPending || isConfirming);
  };

  const handleRefresh = () => {
    console.log("[ApprovalQueue] Manual refresh triggered");
    refetchQueue();
  };

  const isRefreshing = isLoadingQueue || isLoadingDetails;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Loading pending approvals...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Queue'}
        </Button>
      </div>

      {pendingPayments.length === 0 ? (
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
        pendingPayments.map((payment) => {
          const approving = isApproving(payment.txHash);
          // Hardcoded for demo: All pots require 1 approval (CFO only)
          const requiredApprovals = 1;

          return (
            <Card key={payment.txHash} className="card-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{payment.potName} Payment</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatTimestamp(payment.txHash)}</span>
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
                      {formatUSDC(payment.totalAmount)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Transaction Hash</span>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-xs">{truncateTxHash(payment.txHash)}</p>
                      <a
                        href={getExplorerTxUrl(payment.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Approvals</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">
                        {payment.approvalCount.toString()} / {requiredApprovals}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-full">
                        <Button
                          onClick={() => handleApprove(payment.txHash, payment.potName)}
                          className="w-full"
                          disabled={
                            !canApprove ||
                            approving ||
                            payment.approvalCount >= BigInt(requiredApprovals)
                          }
                        >
                          {!canApprove && <Lock className="mr-2 h-4 w-4" />}
                          {approving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isPending ? "Confirming..." : "Approving..."}
                            </>
                          ) : payment.approvalCount >= BigInt(requiredApprovals) ? (
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
                      </span>
                    </TooltipTrigger>
                    {!canApprove && (
                      <TooltipContent>
                        <p>Only CFO can approve payments</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
