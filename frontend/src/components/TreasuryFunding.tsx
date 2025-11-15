import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownToLine, Loader2, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { depositFiat, getTreasuryBalance, pollTransferStatus, isApiError } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { getExplorerAddressUrl } from "@/lib/utils";
import { treasuryVaultAddress } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";

export function TreasuryFunding() {
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<"pending" | "complete" | "failed" | null>(null);
  const { toast } = useToast();

  // Fetch treasury balance on mount
  useEffect(() => {
    fetchTreasuryBalance();
  }, []);

  const fetchTreasuryBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const response = await getTreasuryBalance();
      if (!isApiError(response)) {
        setTreasuryBalance(response.data.balance);
      } else {
        console.error("Failed to fetch treasury balance:", response.error);
      }
    } catch (error) {
      console.error("Error fetching treasury balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit.",
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);
    setTransferStatus("pending");

    try {
      // Call Circle Gateway API to deposit fiat → USDC to contract
      const response = await depositFiat(amount, "USD", "contract");

      if (isApiError(response)) {
        throw new Error(response.error);
      }

      const { transferId: newTransferId } = response.data;
      setTransferId(newTransferId);

      toast({
        title: "Deposit Initiated",
        description: `Depositing $${formatNumber(parseFloat(amount))} to treasury...`,
      });

      // Poll for transfer completion
      const statusResponse = await pollTransferStatus(newTransferId);

      if (!isApiError(statusResponse) && statusResponse.data.status === "complete") {
        setTransferStatus("complete");
        toast({
          title: "✅ Deposit Complete",
          description: `$${formatNumber(parseFloat(amount))} successfully deposited to treasury!`,
        });

        // Refresh treasury balance
        await fetchTreasuryBalance();

        // Reset form
        setAmount("");
        setTransferId(null);
        setTimeout(() => setTransferStatus(null), 3000);
      } else {
        setTransferStatus("failed");
        toast({
          title: "❌ Deposit Failed",
          description: isApiError(statusResponse) ? statusResponse.error : "Transfer timed out or failed.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Deposit error:", error);
      setTransferStatus("failed");
      toast({
        title: "❌ Deposit Error",
        description: error.message || "Failed to deposit funds.",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-blue-600" />
          Treasury Funding
        </CardTitle>
        <CardDescription>
          Deposit fiat (USD) → USDC directly to the TreasuryVault contract via Circle Gateway
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Treasury Balance */}
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Current On-Chain Balance</p>
              {isLoadingBalance ? (
                <div className="flex items-center gap-2 mt-1">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-400">Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${treasuryBalance ? formatNumber(parseFloat(treasuryBalance)) : "0.00"}
                </p>
              )}
            </div>
            <a
              href={getExplorerAddressUrl(treasuryVaultAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              View on ArcScan
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="deposit-amount">Deposit Amount (USD)</Label>
            <Input
              id="deposit-amount"
              type="number"
              placeholder="1000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isDepositing}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Circle will convert USD → USDC and send directly to the Arc contract
            </p>
          </div>

          <Button
            onClick={handleDeposit}
            disabled={isDepositing || !amount}
            className="w-full"
            size="lg"
          >
            {isDepositing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing Deposit...
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Deposit to Treasury
              </>
            )}
          </Button>
        </div>

        {/* Transfer Status */}
        {transferStatus && (
          <div
            className={`p-3 rounded-lg border ${
              transferStatus === "complete"
                ? "bg-green-50 border-green-200"
                : transferStatus === "failed"
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {transferStatus === "complete" && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Deposit Complete!</span>
                </>
              )}
              {transferStatus === "failed" && (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Deposit Failed</span>
                </>
              )}
              {transferStatus === "pending" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Processing deposit...</span>
                </>
              )}
            </div>
            {transferId && (
              <p className="text-xs text-gray-600 mt-1">Transfer ID: {transferId}</p>
            )}
          </div>
        )}

        {/* Info Notice */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            💡 <strong>Direct to Contract:</strong> Funds are deposited directly to the TreasuryVault
            contract on Arc Testnet. No intermediate Circle wallet needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
