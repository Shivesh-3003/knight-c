import { useReadContract } from 'wagmi';
import { TREASURY_ADDRESS, TREASURY_ABI } from '../lib/contracts';

/**
 * Custom hook for treasury operations
 * - Get total treasury balance
 * - Fund treasury via Circle Gateway
 * - Create new departmental Pots
 */
export function useTreasuryBalance() {
  const { data, isLoading, error } = useReadContract({
    address: TREASURY_ADDRESS,
    abi: TREASURY_ABI,
    functionName: 'getTotalBalance',
  });

  return {
    balance: data ? {
      value: data as bigint,
      formatted: formatUSDC(data as bigint),
    } : null,
    isLoading,
    error,
  };
}

export function useFundTreasury() {
  // TODO: Implement Circle Gateway integration
  // TODO: Use wagmi's useWriteContract for on-chain interaction
  return {
    fundTreasury: async (amount: number) => {
      console.log('Funding treasury with', amount, 'USDC');
      // Placeholder implementation
    },
    isLoading: false,
  };
}

export function useCreatePot() {
  // TODO: Implement Pot creation
  return {
    createPot: async (params: {
      name: string;
      budget: number;
      isPrivate: boolean;
      approvalThreshold: number;
    }) => {
      console.log('Creating pot:', params);
      // Placeholder implementation
    },
    isLoading: false,
  };
}

// Helper functions
function formatUSDC(value: bigint): string {
  // USDC has 6 decimals
  const formatted = Number(value) / 1e6;
  return formatted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
