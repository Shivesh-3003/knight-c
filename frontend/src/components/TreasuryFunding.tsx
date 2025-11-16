import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownToLine, Loader2, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { mockMintAndDeposit, getTreasuryBalance } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { useBankBalance } from "./BankAccountBalance";
import { getExplorerAddressUrl } from "@/lib/utils";
import { treasuryVaultAddress } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";

// Supported chains for treasury funding
const SUPPORTED_CHAINS = [
  { id: "arc", name: "Arc Testnet", implemented: true },
  { id: "ethereum", name: "Ethereum Sepolia", implemented: true },
  { id: "base", name: "Base Sepolia", implemented: false },
  { id: "arbitrum", name: "Arbitrum Sepolia", implemented: false },
  { id: "polygon", name: "Polygon Amoy", implemented: false },
] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number]["id"];

export function TreasuryFunding() {
  const [amount, setAmount] = useState("");
  const [selectedChain, setSelectedChain] = useState<SupportedChainId>("arc");
  const [isDepositing, setIsDepositing] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<"pending" | "complete" | "failed" | null>(null);
  const { toast } = useToast();
  const { balance: bankBalance, deductFromBalance } = useBankBalance();

  // Fetch treasury balance on mount
  useEffect(() => {
    fetchTreasuryBalance();
  }, []);

  const fetchTreasuryBalance = async () => {
    setIsLoadingBalance(true);
    try {
      // Always fetch real API balance (no mocking for treasury)
      const response = await getTreasuryBalance();
      if (response.success && response.data) {
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

    // Check if bank balance is sufficient
    if (parseFloat(amount) > bankBalance) {
      toast({
        title: "Insufficient Bank Balance",
        description: `You only have $${formatNumber(bankBalance)} in your bank account.`,
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);
    setTransferStatus("pending");

    try {
      // Step 1: Deduct from bank balance immediately
      deductFromBalance(parseFloat(amount));

      toast({
        title: "Bank Transfer Initiated",
        description: `Converting $${formatNumber(parseFloat(amount))} USD to USDC...`,
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // MOCKED: Set Ethereum balance to deposited amount (REPLACE, not add)
      // This simulates the USD -> USDC conversion appearing on Ethereum
      sessionStorage.setItem("mockedEthereumBalance", amount);

      // Generate mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      setTransferId(mockTxHash);

      setTransferStatus("complete");
      toast({
        title: "✅ Deposit Complete",
        description: `$${formatNumber(parseFloat(amount))} successfully deposited to ${selectedChain === "arc" ? "Arc Testnet" : SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.name}!`,
      });

      // Refresh treasury balance from sessionStorage
      await fetchTreasuryBalance();

      // Reset form
      setAmount("");
      setTransferId(null);
      setTimeout(() => setTransferStatus(null), 3000);
    } catch (error: any) {
      console.error("Deposit error:", error);
      setTransferStatus("failed");
      // Refund bank balance if deposit failed
      deductFromBalance(-parseFloat(amount));
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
          Transfer from your bank account (USD) → Convert to USDC → Deposit to Treasury on selected chain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deposit Form */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="deposit-amount">Transfer from Bank Account (USD)</Label>
            <Input
              id="deposit-amount"
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isDepositing}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Funds will be converted to USDC via Circle Mint and deposited to the selected chain
            </p>
          </div>

          {/* Chain Selector */}
          <div>
            <Label htmlFor="chain-select">Destination Chain</Label>
            <Select value={selectedChain} onValueChange={(value) => setSelectedChain(value as SupportedChainId)}>
              <SelectTrigger id="chain-select" className="mt-1">
                <SelectValue placeholder="Select chain" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CHAINS.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id}>
                    {chain.name}
                    {!chain.implemented && " (Coming Soon)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {selectedChain === "arc"
                ? "USDC will be deposited directly to TreasuryVault on Arc"
                : "USDC will be deposited to Circle Gateway wallet on this chain"}
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
            💡 <strong>How it works:</strong> Your bank USD is converted to USDC via Circle Mint, then deposited to{" "}
            {selectedChain === "arc"
              ? "the TreasuryVault contract on Arc (direct deposit)"
              : "Circle Gateway wallet on " + SUPPORTED_CHAINS.find(c => c.id === selectedChain)?.name + " (unified balance)"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
