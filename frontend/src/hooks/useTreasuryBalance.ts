import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { treasuryVaultAddress } from "@/lib/contract";
import { treasuryVaultABI } from "@/lib/wagmi";
import { USDC_DECIMALS } from "@/lib/constants";

/**
 * Hook to query treasury balance directly from blockchain
 * @returns balance (formatted string), balanceRaw (bigint), loading state, and refetch function
 */
export function useTreasuryBalance() {
  const {
    data: balanceRaw,
    isLoading,
    isError,
    refetch,
  } = useReadContract({
    address: treasuryVaultAddress,
    abi: treasuryVaultABI,
    functionName: "getTreasuryBalance",
    query: {
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    },
  });

  // Format balance from smallest units (6 decimals for USDC) to human-readable
  const balance = balanceRaw ? formatUnits(balanceRaw as bigint, USDC_DECIMALS) : "0";

  return {
    balance,
    balanceRaw: balanceRaw as bigint | undefined,
    isLoading,
    isError,
    refetch,
  };
}
