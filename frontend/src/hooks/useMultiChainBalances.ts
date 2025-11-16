import { useState, useEffect, useRef } from "react";
import { getArcBalance, getSepoliaBalance, getBaseBalance, getArbitrumBalance, getPolygonBalance } from "@/lib/api";
import { treasuryVaultAddress } from "@/lib/contract";

interface ChainBalance {
  chain: string;
  balance: string;
  isLoading: boolean;
  error: string | null;
}

export function useMultiChainBalances() {
  const [balances, setBalances] = useState<Record<string, ChainBalance>>({
    arc: { chain: "Arc", balance: "0", isLoading: true, error: null },
    ethereum: { chain: "Ethereum", balance: "0", isLoading: true, error: null },
    base: { chain: "Base", balance: "0", isLoading: true, error: null },
    arbitrum: { chain: "Arbitrum", balance: "0", isLoading: true, error: null },
    polygon: { chain: "Polygon", balance: "0", isLoading: true, error: null },
  });

  const realEthBalanceRef = useRef<string>("0");

  const fetchBalances = async () => {
    // Set all to loading
    setBalances((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[key] = { ...updated[key], isLoading: true, error: null };
      });
      return updated;
    });

    // Fetch Arc balance
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

    // Fetch Ethereum balance
    try {
      const ethResponse = await getSepoliaBalance(treasuryVaultAddress);
      if (ethResponse.success && ethResponse.data) {
        realEthBalanceRef.current = ethResponse.data.balance;
        const mockedEthBalance = sessionStorage.getItem("mockedEthereumBalance");
        setBalances((prev) => ({
          ...prev,
          ethereum: {
            chain: "Ethereum",
            balance: mockedEthBalance || ethResponse.data.balance,
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

    // Fetch Base balance
    try {
      const baseResponse = await getBaseBalance(treasuryVaultAddress);
      if (baseResponse.success && baseResponse.data) {
        setBalances((prev) => ({
          ...prev,
          base: {
            chain: "Base",
            balance: baseResponse.data.balance,
            isLoading: false,
            error: null,
          },
        }));
      } else {
        throw new Error(baseResponse.error || "Failed to fetch Base balance");
      }
    } catch (error: any) {
      setBalances((prev) => ({
        ...prev,
        base: {
          chain: "Base",
          balance: "0",
          isLoading: false,
          error: error.message,
        },
      }));
    }

    // Fetch Arbitrum balance
    try {
      const arbitrumResponse = await getArbitrumBalance(treasuryVaultAddress);
      if (arbitrumResponse.success && arbitrumResponse.data) {
        setBalances((prev) => ({
          ...prev,
          arbitrum: {
            chain: "Arbitrum",
            balance: arbitrumResponse.data.balance,
            isLoading: false,
            error: null,
          },
        }));
      } else {
        throw new Error(arbitrumResponse.error || "Failed to fetch Arbitrum balance");
      }
    } catch (error: any) {
      setBalances((prev) => ({
        ...prev,
        arbitrum: {
          chain: "Arbitrum",
          balance: "0",
          isLoading: false,
          error: error.message,
        },
      }));
    }

    // Fetch Polygon balance
    try {
      const polygonResponse = await getPolygonBalance(treasuryVaultAddress);
      if (polygonResponse.success && polygonResponse.data) {
        setBalances((prev) => ({
          ...prev,
          polygon: {
            chain: "Polygon",
            balance: polygonResponse.data.balance,
            isLoading: false,
            error: null,
          },
        }));
      } else {
        throw new Error(polygonResponse.error || "Failed to fetch Polygon balance");
      }
    } catch (error: any) {
      setBalances((prev) => ({
        ...prev,
        polygon: {
          chain: "Polygon",
          balance: "0",
          isLoading: false,
          error: error.message,
        },
      }));
    }
  };

  useEffect(() => {
    fetchBalances();

    // Poll for sessionStorage changes to update Ethereum balance in real-time
    const interval = setInterval(() => {
      const mockedEthBalance = sessionStorage.getItem("mockedEthereumBalance");

      setBalances((prev) => {
        const updated = { ...prev };
        if (prev.ethereum && !prev.ethereum.isLoading) {
          updated.ethereum = {
            ...prev.ethereum,
            balance: mockedEthBalance || realEthBalanceRef.current
          };
        }
        return updated;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Calculate total balance across all chains
  const totalBalance = Object.values(balances).reduce((sum, chainBalance) => {
    if (!chainBalance.error && !chainBalance.isLoading) {
      return sum + parseFloat(chainBalance.balance || "0");
    }
    return sum;
  }, 0);

  const isLoading = Object.values(balances).some((b) => b.isLoading);
  const hasError = Object.values(balances).some((b) => b.error !== null);

  return {
    balances,
    totalBalance: totalBalance.toString(),
    isLoading,
    hasError,
    refetch: fetchBalances,
  };
}
