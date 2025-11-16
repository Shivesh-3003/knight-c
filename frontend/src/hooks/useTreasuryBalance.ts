import { useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { treasuryVaultAddress } from "@/lib/contract";
import { treasuryVaultABI } from "@/lib/wagmi";
import { USDC_DECIMALS } from "@/lib/constants";
import { useState, useEffect } from "react";

/**
 * Hook to query treasury balance directly from blockchain
 * @returns balance (formatted string), balanceRaw (bigint), loading state, and refetch function
 */
export function useTreasuryBalance() {
  const [mockedEthBalance, setMockedEthBalance] = useState<string>("0");

  const {
    data: balanceRaw,
    isLoading,
    isError,
    refetch: refetchContract,
  } = useReadContract({
    address: treasuryVaultAddress,
    abi: treasuryVaultABI,
    functionName: "getTreasuryBalance",
    query: {
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    },
  });

  // Check for mocked Ethereum balance in sessionStorage (temporary, clears on refresh)
  useEffect(() => {
    const checkMockedEthBalance = () => {
      const mocked = sessionStorage.getItem("mockedEthereumBalance");
      setMockedEthBalance(mocked || "0");
    };

    checkMockedEthBalance();

    // Poll for sessionStorage changes since storage event doesn't fire for same tab
    const interval = setInterval(checkMockedEthBalance, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Custom refetch that also checks sessionStorage
  const refetch = () => {
    const mocked = sessionStorage.getItem("mockedEthereumBalance");
    setMockedEthBalance(mocked || "0");
    return refetchContract();
  };

  // Arc balance is always real (from blockchain)
  const arcBalance = balanceRaw ? formatUnits(balanceRaw as bigint, USDC_DECIMALS) : "0";

  // Total balance = Arc + Ethereum (mocked)
  const totalBalance = (parseFloat(arcBalance) + parseFloat(mockedEthBalance)).toString();

  const balanceRawValue = parseUnits(totalBalance, USDC_DECIMALS);

  return {
    balance: totalBalance,
    balanceRaw: balanceRawValue,
    isLoading,
    isError,
    refetch,
  };
}
