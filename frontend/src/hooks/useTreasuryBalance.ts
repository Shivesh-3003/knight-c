import { parseUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/constants";
import { useMultiChainBalances } from "./useMultiChainBalances";

/**
 * Hook to query total treasury balance across all chains
 * @returns balance (formatted string), balanceRaw (bigint), loading state, and refetch function
 */
export function useTreasuryBalance() {
  const { totalBalance, isLoading, hasError, refetch } = useMultiChainBalances();

  const balanceRawValue = parseUnits(totalBalance || "0", USDC_DECIMALS);

  return {
    balance: totalBalance,
    balanceRaw: balanceRawValue,
    isLoading,
    isError: hasError,
    refetch,
  };
}
