import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { getArcBalance, getSepoliaBalance } from "@/lib/api";
import { treasuryVaultAddress } from "@/lib/contract";

// Chain configuration with icons and colors
const CHAINS = [
  {
    id: "arc",
    name: "Arc",
    fullName: "Arc Testnet",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "🔷",
    implemented: true,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    fullName: "Ethereum Sepolia",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: "⬡",
    implemented: true,
  },
  {
    id: "base",
    name: "Base",
    fullName: "Base Sepolia",
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    icon: "🔵",
    implemented: false,
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    fullName: "Arbitrum Sepolia",
    color: "bg-cyan-500",
    textColor: "text-cyan-700",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    icon: "🔺",
    implemented: false,
  },
  {
    id: "polygon",
    name: "Polygon",
    fullName: "Polygon Amoy",
    color: "bg-violet-500",
    textColor: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    icon: "⬣",
    implemented: false,
  },
] as const;

interface ChainBalance {
  chain: string;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export function MultiChainBalances() {
  const [balances, setBalances] = useState<Record<string, ChainBalance>>(() => {
    const initial: Record<string, ChainBalance> = {};
    CHAINS.forEach((chain) => {
      initial[chain.id] = {
        chain: chain.name,
        balance: "0",
        isLoading: true,
        error: null,
      };
    });
    return initial;
  });

  const fetchBalances = async () => {
    // Set all to loading
    setBalances((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key] = { ...updated[key], isLoading: true, error: null };
      });
      return updated;
    });

    // Fetch Arc balance (TreasuryVault contract balance on Arc)
    try {
      const arcResponse = await getArcBalance(treasuryVaultAddress);
      if (arcResponse.success && arcResponse.data) {
        setBalances((prev) => ({
          ...prev,
          arc: {
            chain: "Arc",
            balance: arcResponse.data.balance,
            isLoading: false,
            error: null,
          },
        }));
      } else {
        throw new Error(arcResponse.error || "Failed to fetch Arc balance");
      }
    } catch (error: any) {
      setBalances((prev) => ({
        ...prev,
        arc: {
          chain: "Arc",
          balance: "0",
          isLoading: false,
          error: error.message,
        },
      }));
    }

    // Fetch Ethereum balance (Gateway wallet balance on Sepolia)
    try {
      const ethResponse = await getSepoliaBalance(treasuryVaultAddress);
      if (ethResponse.success && ethResponse.data) {
        setBalances((prev) => ({
          ...prev,
          ethereum: {
            chain: "Ethereum",
            balance: ethResponse.data.balance,
            isLoading: false,
            error: null,
          },
        }));
      } else {
        throw new Error(ethResponse.error || "Failed to fetch Ethereum balance");
      }
    } catch (error: any) {
      setBalances((prev) => ({
        ...prev,
        ethereum: {
          chain: "Ethereum",
          balance: "0",
          isLoading: false,
          error: error.message,
        },
      }));
    }

    // Mock balances for Base, Arbitrum, Polygon (placeholders)
    setTimeout(() => {
      setBalances((prev) => ({
        ...prev,
        base: {
          chain: "Base",
          balance: "0",
          isLoading: false,
          error: null,
        },
        arbitrum: {
          chain: "Arbitrum",
          balance: "0",
          isLoading: false,
          error: null,
        },
        polygon: {
          chain: "Polygon",
          balance: "0",
          isLoading: false,
          error: null,
        },
      }));
    }, 500);
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Multi-Chain Treasury Balances</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchBalances}
          disabled={Object.values(balances).some((b) => b.isLoading)}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw
            className={`h-3 w-3 mr-1 ${
              Object.values(balances).some((b) => b.isLoading) ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {CHAINS.map((chain) => {
          const balance = balances[chain.id];

          return (
            <Card
              key={chain.id}
              className={`border-2 ${chain.borderColor} ${chain.bgColor} hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-3">
                <div className="flex flex-col gap-2">
                  {/* Chain Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{chain.icon}</span>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${chain.textColor}`}>{chain.name}</p>
                      {!chain.implemented && (
                        <p className="text-[10px] text-gray-500">Coming Soon</p>
                      )}
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div>
                    {balance.isLoading ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        <span className="text-xs text-gray-400">Loading...</span>
                      </div>
                    ) : balance.error ? (
                      <div>
                        <p className="text-xs text-red-600">Error</p>
                        <p className="text-[10px] text-red-500">{balance.error}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-financial">
                          ${formatNumber(parseFloat(balance.balance))}
                        </p>
                        <p className="text-[10px] text-gray-500">USDC</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Notice */}
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Circle Gateway:</strong> These balances represent your unified USDC treasury across
          multiple chains via Circle's cross-chain infrastructure.
        </p>
      </div>
    </div>
  );
}
