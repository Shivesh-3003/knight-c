// backend/src/services/circle.service.ts
// Circle Gateway Service - Cross-chain USDC transfers via Circle Gateway

import { createPublicClient, createWalletClient, http, parseUnits, parseAbi, type Address } from 'viem';
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

// Contract Addresses - loaded from environment variables
const SEPOLIA_USDC_ADDRESS = (process.env.SEPOLIA_USDC_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') as Address;
const GATEWAY_WALLET_ADDRESS = (process.env.GATEWAY_WALLET_ADDRESS || '0x0077777d7EBA4688BDeF3E311b846F25870A19B9') as Address;
const ARC_USDC_ADDRESS = (process.env.USDC_TOKEN_ADDRESS || process.env.VITE_USDC_ADDRESS || '0x3600000000000000000000000000000000000000') as Address;
const GATEWAY_MINTER_ADDRESS = (process.env.GATEWAY_MINTER_ADDRESS || '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B') as Address;

// ABIs - Using parseAbi for better type inference in viem v2
const erc20Abi = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]);

const gatewayWalletAbi = parseAbi([
  'function deposit(address token, uint256 value)',
]);

const treasuryAbi = parseAbi([
  'function depositToTreasury(uint256 amount)',
]);

// Gateway Minter ABI - for receiving cross-chain USDC transfers
// Based on Circle's standard message passing pattern
const gatewayMinterAbi = parseAbi([
  'function receiveMessage(bytes message, bytes attestation) returns (bool)',
]);

export interface GatewayDepositResult {
  depositHash: string;
  amount: string;
  status: 'pending' | 'finalized';
  estimatedFinality: string;
}

export interface GatewayAttestationResult {
  messageHash: string;
  message?: string;
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
  private sepoliaWalletClient: any = null;
  private sepoliaPublicClient: any;
  private arcWalletClient: any = null;
  private arcPublicClient: any;
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
        chain: undefined,
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
        chain: undefined,
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
      if (!this.circleApiKey) {
        throw new Error('Circle API key not configured. Set CIRCLE_API_KEY in .env file.');
      }

      console.log(`Fetching attestation for message hash: ${messageHash}`);

      // Circle Gateway API endpoint for attestations
      // Note: This endpoint returns both 'message' and 'attestation' fields when complete
      // Both are required for the mintOnArc function to submit to Gateway Minter
      const apiUrl = `https://api.circle.com/v1/w3s/transfers/${messageHash}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${this.circleApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      // Check if attestation is available
      if (data.status === 'complete' && data.attestation && data.message) {
        console.log('✅ Attestation retrieved successfully');
        return {
          messageHash,
          status: 'ready',
          message: data.message,
          attestation: data.attestation
        };
      } else if (data.status === 'pending_finality' || data.status === 'pending') {
        console.log('⏳ Transfer pending finality on source chain');
        return { messageHash, status: 'pending_finality', message: undefined, attestation: undefined };
      } else {
        console.log(`❌ Transfer status: ${data.status}`);
        return { messageHash, status: 'not_found', message: undefined, attestation: undefined };
      }
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          console.log('❌ Transfer not found - may not be finalized yet');
          return { messageHash, status: 'not_found', message: undefined, attestation: undefined };
        } else if (status === 401 || status === 403) {
          throw new Error('Circle API authentication failed. Check your CIRCLE_API_KEY.');
        }
        throw new Error(
          `Circle API error (${status}): ${error.response.data?.message || 'Unknown error'}`
        );
      }
      throw new Error(`Get attestation failed: ${error.message || error}`);
    }
  }

  /**
   * Mint USDC on Arc using Gateway attestation
   * This completes the cross-chain transfer
   *
   * @param message - Encoded message payload from Gateway
   * @param attestation - Cryptographic proof from Gateway
   * @returns Mint transaction details
   */
  async mintOnArc(message: string, attestation: string): Promise<GatewayMintResult> {
    if (!this.account || !this.arcWalletClient) {
      throw new Error('Private key not configured. Set PRIVATE_KEY in .env file.');
    }

    try {
      console.log('Submitting attestation to Gateway Minter on Arc...');

      // Submit message and attestation to Gateway Minter contract
      const mintHash = await this.arcWalletClient.writeContract({
        address: GATEWAY_MINTER_ADDRESS,
        abi: gatewayMinterAbi,
        functionName: 'receiveMessage',
        args: [message as `0x${string}`, attestation as `0x${string}`],
        chain: undefined,
      });

      console.log(`Minting transaction submitted: ${mintHash}`);

      // Wait for transaction confirmation
      const receipt = await this.arcPublicClient.waitForTransactionReceipt({ hash: mintHash });

      if (receipt.status === 'success') {
        console.log('✅ USDC minted successfully on Arc!');

        // Extract amount from logs if possible
        let amount = '0';
        try {
          const transferEvent = receipt.logs.find(
            (log: any) =>
              log.topics[0] ===
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
          );
          if (transferEvent && transferEvent.data) {
            amount = (BigInt(transferEvent.data) / BigInt(1_000_000)).toString();
          }
        } catch (decodeError) {
          console.log('Note: Could not decode transfer amount from logs');
        }

        return { mintHash, amount, status: 'success' };
      } else {
        throw new Error('Mint transaction failed');
      }
    } catch (error: any) {
      if (error.message?.includes('already processed')) {
        throw new Error('This attestation has already been used to mint USDC');
      } else if (error.message?.includes('invalid attestation')) {
        throw new Error('Invalid attestation signature');
      }
      throw new Error(`Mint on Arc failed: ${error.message || error}`);
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
        chain: undefined,
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
        chain: undefined,
      });

      await this.arcPublicClient.waitForTransactionReceipt({ hash: depositHash });
      console.log(`Treasury deposit confirmed: ${depositHash}`);

      return depositHash;
    } catch (error) {
      throw new Error(`Deposit to treasury failed: ${error}`);
    }
  }
}
