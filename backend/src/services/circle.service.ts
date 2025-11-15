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

// Gateway Minter ABI - for receiving cross-chain USDC transfers
// Based on Circle's standard message passing pattern
const gatewayMinterAbi = [
  {
    name: 'receiveMessage',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }],
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
      if (!this.circleApiKey) {
        throw new Error('Circle API key not configured. Set CIRCLE_API_KEY in .env file.');
      }

      console.log(`Fetching attestation for message hash: ${messageHash}`);

      // Circle Gateway API endpoint for attestations
      const apiUrl = `https://api.circle.com/v1/w3s/transfers/${messageHash}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${this.circleApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      // Check if attestation is available
      if (data.status === 'complete' && data.attestation) {
        console.log('✅ Attestation retrieved successfully');
        return { messageHash, status: 'ready', attestation: data.attestation };
      } else if (data.status === 'pending_finality' || data.status === 'pending') {
        console.log('⏳ Transfer pending finality on source chain');
        return { messageHash, status: 'pending_finality', attestation: undefined };
      } else {
        console.log(`❌ Transfer status: ${data.status}`);
        return { messageHash, status: 'not_found', attestation: undefined };
      }
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          console.log('❌ Transfer not found - may not be finalized yet');
          return { messageHash, status: 'not_found', attestation: undefined };
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
            (log) =>
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
