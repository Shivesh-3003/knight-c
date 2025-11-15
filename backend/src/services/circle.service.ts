// backend/src/services/circle.service.ts
// Circle Gateway Service - Cross-chain USDC transfers via Circle Gateway
// NOT a fiat on-ramp - handles cross-chain USDC movement only

import { createPublicClient, createWalletClient, http, parseUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import axios from 'axios';

// Arc Testnet Chain Configuration
const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
} as const;

// Contract Addresses
const SEPOLIA_USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address;
const GATEWAY_WALLET_ADDRESS = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as Address;
const ARC_USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as Address;
const GATEWAY_MINTER_ADDRESS = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as Address;

// ABIs
const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const gatewayWalletAbi = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

const treasuryAbi = [
  {
    name: 'depositToTreasury',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

export interface GatewayDepositResult {
  depositHash: string;
  amount: string;
  status: 'pending' | 'finalized';
  estimatedFinality: string;
}

export interface GatewayAttestationResult {
  messageHash: string;
  attestation?: string;
  status: 'pending_finality' | 'ready' | 'not_found';
}

export interface GatewayMintResult {
  mintHash: string;
  amount: string;
  status: 'success' | 'failed';
}

export class CircleService {
  private account: ReturnType<typeof privateKeyToAccount> | null = null;
  private sepoliaWalletClient: ReturnType<typeof createWalletClient> | null = null;
  private sepoliaPublicClient: ReturnType<typeof createPublicClient>;
  private arcWalletClient: ReturnType<typeof createWalletClient> | null = null;
  private arcPublicClient: ReturnType<typeof createPublicClient>;
  private circleApiKey: string;

  constructor() {
    // Initialize Circle API key
    this.circleApiKey = process.env.CIRCLE_API_KEY || '';

    // Initialize Sepolia clients
    if (process.env.PRIVATE_KEY) {
      this.account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
      this.sepoliaWalletClient = createWalletClient({
        account: this.account,
        chain: sepolia,
        transport: http(),
      });
      this.arcWalletClient = createWalletClient({
        account: this.account,
        chain: arcTestnet,
        transport: http('https://rpc.testnet.arc.network'),
      });
    }

    this.sepoliaPublicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    this.arcPublicClient = createPublicClient({
      chain: arcTestnet,
      transport: http('https://rpc.testnet.arc.network'),
    });
  }

  /**
   * Deposit USDC to Gateway Wallet on Sepolia
   * This initiates the cross-chain transfer flow
   *
   * @param amount - Amount in USDC (as string with decimals)
   * @returns Deposit transaction details
   */
  async depositToGateway(amount: string): Promise<GatewayDepositResult> {
    if (!this.account || !this.sepoliaWalletClient) {
      throw new Error('Private key not configured. Set PRIVATE_KEY in .env file.');
    }

    try {
      const amountInUnits = parseUnits(amount, 6); // USDC has 6 decimals

      // Step 1: Approve Gateway Wallet to spend USDC
      console.log('Approving Gateway Wallet to spend USDC...');
      const approvalHash = await this.sepoliaWalletClient.writeContract({
        address: SEPOLIA_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [GATEWAY_WALLET_ADDRESS, amountInUnits],
      });

      await this.sepoliaPublicClient.waitForTransactionReceipt({ hash: approvalHash });
      console.log(`Approval confirmed: ${approvalHash}`);

      // Step 2: Deposit USDC to Gateway Wallet
      console.log('Depositing USDC to Gateway Wallet...');
      const depositHash = await this.sepoliaWalletClient.writeContract({
        address: GATEWAY_WALLET_ADDRESS,
        abi: gatewayWalletAbi,
        functionName: 'deposit',
        args: [SEPOLIA_USDC_ADDRESS, amountInUnits],
      });

      await this.sepoliaPublicClient.waitForTransactionReceipt({ hash: depositHash });
      console.log(`Deposit confirmed: ${depositHash}`);

      // Sepolia finality: ~12-15 minutes (~32 blocks)
      const estimatedFinality = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      return {
        depositHash,
        amount,
        status: 'pending',
        estimatedFinality,
      };
    } catch (error) {
      throw new Error(`Gateway deposit failed: ${error}`);
    }
  }

  /**
   * Get Gateway attestation for cross-chain transfer
   * Attestation is available after source chain finality (~12-15 min for Sepolia)
   *
   * @param messageHash - Transaction hash from depositToGateway
   * @returns Attestation details
   */
  async getGatewayAttestation(messageHash: string): Promise<GatewayAttestationResult> {
    try {
      // In production, you would call Circle Gateway API to get attestation
      // For now, we return a mock response structure
      //
      // Example Circle Gateway API call:
      // const response = await axios.get(
      //   `https://api.circle.com/v1/gateway/attestations/${messageHash}`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.circleApiKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      console.log(`Fetching attestation for message hash: ${messageHash}`);
      console.log('⚠️  Gateway API integration not yet implemented');
      console.log('⚠️  In production, this would call Circle Gateway API');

      return {
        messageHash,
        status: 'pending_finality',
        attestation: undefined,
      };
    } catch (error) {
      throw new Error(`Get attestation failed: ${error}`);
    }
  }

  /**
   * Mint USDC on Arc using Gateway attestation
   * This completes the cross-chain transfer
   *
   * @param attestation - Cryptographic proof from Gateway
   * @param amount - Amount to mint (must match attestation)
   * @returns Mint transaction details
   */
  async mintOnArc(attestation: string, amount: string): Promise<GatewayMintResult> {
    if (!this.account || !this.arcWalletClient) {
      throw new Error('Private key not configured');
    }

    try {
      // In production, you would submit attestation to Gateway Minter contract
      // For now, we return a mock response
      //
      // Example transaction:
      // const mintHash = await this.arcWalletClient.writeContract({
      //   address: GATEWAY_MINTER_ADDRESS,
      //   abi: gatewayMinterAbi,
      //   functionName: 'mint',
      //   args: [attestation],
      // });

      console.log('⚠️  Gateway Minter integration not yet implemented');
      console.log('⚠️  In production, this would submit attestation to Gateway Minter on Arc');

      return {
        mintHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        amount,
        status: 'success',
      };
    } catch (error) {
      throw new Error(`Mint on Arc failed: ${error}`);
    }
  }

  /**
   * Get USDC balance on Sepolia
   * @param address - Wallet address to check
   */
  async getSepoliaBalance(address: Address): Promise<string> {
    try {
      const balance = await this.sepoliaPublicClient.readContract({
        address: SEPOLIA_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      return (Number(balance) / 1_000_000).toString(); // Convert from 6 decimals
    } catch (error) {
      throw new Error(`Get Sepolia balance failed: ${error}`);
    }
  }

  /**
   * Get USDC balance on Arc
   * @param address - Wallet address to check
   */
  async getArcBalance(address: Address): Promise<string> {
    try {
      const balance = await this.arcPublicClient.readContract({
        address: ARC_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      return (Number(balance) / 1_000_000).toString(); // Convert from 6 decimals
    } catch (error) {
      throw new Error(`Get Arc balance failed: ${error}`);
    }
  }

  /**
   * Transfer USDC to TreasuryVault on Arc (after minting via Gateway)
   *
   * @param amount - Amount in USDC
   * @param treasuryAddress - TreasuryVault contract address
   * @returns Transfer transaction details
   */
  async depositToTreasury(amount: string, treasuryAddress: Address): Promise<string> {
    if (!this.account || !this.arcWalletClient) {
      throw new Error('Private key not configured');
    }

    try {
      const amountInUnits = parseUnits(amount, 6);

      // Step 1: Approve TreasuryVault to spend USDC
      console.log('Approving TreasuryVault to spend USDC...');
      const approvalHash = await this.arcWalletClient.writeContract({
        address: ARC_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [treasuryAddress, amountInUnits],
      });

      await this.arcPublicClient.waitForTransactionReceipt({ hash: approvalHash });
      console.log(`Approval confirmed: ${approvalHash}`);

      // Step 2: Deposit to TreasuryVault
      console.log('Depositing to TreasuryVault...');
      const depositHash = await this.arcWalletClient.writeContract({
        address: treasuryAddress,
        abi: treasuryAbi,
        functionName: 'depositToTreasury',
        args: [amountInUnits],
      });

      await this.arcPublicClient.waitForTransactionReceipt({ hash: depositHash });
      console.log(`Treasury deposit confirmed: ${depositHash}`);

      return depositHash;
    } catch (error) {
      throw new Error(`Deposit to treasury failed: ${error}`);
    }
  }
}
