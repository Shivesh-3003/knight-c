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
// CORRECTED: Gateway uses gatewayMint, not receiveMessage (which is CCTP)
const gatewayMinterAbi = parseAbi([
  'function gatewayMint(bytes attestation, bytes signature) returns (bool)',
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
   * DEPRECATED - THIS METHOD IS INCORRECT FOR GATEWAY
   *
   * This method was attempting to use CCTP attestation fetching for Gateway transfers,
   * which is incorrect. Circle Gateway requires:
   * 1. Deposit to Gateway Wallet (creates unified balance)
   * 2. Create and sign BurnIntent with EIP-712
   * 3. Submit BurnIntent to Gateway API: POST https://gateway-api-testnet.circle.com/v1/transfer
   * 4. Call gatewayMint with the returned attestation and signature
   *
   * For the correct implementation, see scripts/fund-treasury-via-gateway.ts
   *
   * @deprecated Use the correct Gateway workflow with BurnIntent instead
   */
  async getGatewayAttestation(messageHash: string): Promise<GatewayAttestationResult> {
    throw new Error(
      'This method is deprecated. Circle Gateway does not work this way. ' +
      'You must create a BurnIntent and submit it to the Gateway API. ' +
      'See scripts/fund-treasury-via-gateway.ts for the correct implementation.'
    );
  }

  /**
   * Mint USDC on Arc using Gateway attestation
   * CORRECTED: Uses gatewayMint instead of receiveMessage
   *
   * @param attestation - Cryptographic attestation from Gateway API
   * @param signature - Signature from Gateway API
   * @returns Mint transaction details
   */
  async mintOnArc(attestation: string, signature: string): Promise<GatewayMintResult> {
    if (!this.account || !this.arcWalletClient) {
      throw new Error('Private key not configured. Set PRIVATE_KEY in .env file.');
    }

    try {
      console.log('Submitting attestation to Gateway Minter on Arc...');

      // CORRECTED: Gateway uses gatewayMint(attestation, signature)
      // NOT receiveMessage(message, attestation) which is CCTP
      const mintHash = await this.arcWalletClient.writeContract({
        address: GATEWAY_MINTER_ADDRESS,
        abi: gatewayMinterAbi,
        functionName: 'gatewayMint',
        args: [attestation as `0x${string}`, signature as `0x${string}`],
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
   * Get Circle Gateway unified USDC balance
   * This shows the total USDC deposited to Gateway that can be instantly transferred
   * @param address - Wallet address to check
   */
  async getGatewayBalance(address: Address): Promise<string> {
    try {
      const apiUrl = `https://gateway-api-testnet.circle.com/v1/balances/${address}`;

      const response = await axios.get(apiUrl);
      const data = response.data;

      // Gateway API returns balances per domain
      // Sum up all balances to get total unified balance
      if (data && data.balances) {
        const totalBalance = Object.values(data.balances).reduce((sum: number, balance: any) => {
          return sum + Number(balance);
        }, 0);

        return (totalBalance / 1_000_000).toString(); // Convert from 6 decimals
      }

      return '0';
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No balance found, return 0
        return '0';
      }
      throw new Error(`Get Gateway balance failed: ${error.message || error}`);
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
