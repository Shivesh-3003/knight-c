import { createPublicClient, http, formatUnits, defineChain } from 'viem';

// Define Arc Testnet chain
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: [process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

// USDC token address on Arc Testnet
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export class TreasuryService {
  private client;

  constructor() {
    this.client = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });
  }

  /**
   * Get USDC balance of treasury contract
   * @param contractAddress - TreasuryVault contract address
   * @returns Balance in human-readable USDC (e.g., "1000000.50")
   */
  async getTreasuryBalance(contractAddress: string): Promise<string> {
    try {
      const balance = await this.client.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [contractAddress as `0x${string}`],
      });

      // Format from 6 decimals to human-readable
      return formatUnits(balance, 6);
    } catch (error) {
      throw new Error(`Failed to get treasury balance: ${error}`);
    }
  }
}
