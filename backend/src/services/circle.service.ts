// backend/src/services/circle.service.ts
// Circle Gateway Service - Cross-chain USDC transfers via Circle Gateway

import { createPublicClient, createWalletClient, http, parseUnits, parseAbi, type Address } from 'viem';
import { sepolia, arbitrumSepolia, baseSepolia, avalancheFuji, polygonAmoy } from 'viem/chains';
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

// Base Sepolia with Flashblocks RPC
const baseSepoliaWithFlashblocks = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: {
      http: ['https://sepolia-preconf.base.org'], // Flashblocks-aware RPC
    },
  },
} as const;

// Chain-specific USDC addresses
const USDC_ADDRESSES: Record<number, Address> = {
  [sepolia.id]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Ethereum Sepolia
  [arbitrumSepolia.id]: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia
  [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  [avalancheFuji.id]: '0x5425890298aed601595a70ab815c96711a31bc65', // Avalanche Fuji
  [polygonAmoy.id]: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // Polygon Amoy
  [arcTestnet.id]: '0x3600000000000000000000000000000000000000', // Arc Testnet
};

// Supported chains mapping
const SUPPORTED_CHAINS: Record<string, any> = {
  sepolia,
  arbitrum: arbitrumSepolia,
  base: baseSepoliaWithFlashblocks,
  avalanche: avalancheFuji,
  polygon: polygonAmoy,
  arc: arcTestnet,
};

// Gateway Contract Addresses (same across all testnets)
const GATEWAY_WALLET_ADDRESS = (process.env.GATEWAY_WALLET_ADDRESS || '0x0077777d7EBA4688BDeF3E311b846F25870A19B9') as Address;
const GATEWAY_MINTER_ADDRESS = (process.env.GATEWAY_MINTER_ADDRESS || '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B') as Address;

// Legacy environment variables for backward compatibility
const SEPOLIA_USDC_ADDRESS = USDC_ADDRESSES[sepolia.id];
const ARC_USDC_ADDRESS = USDC_ADDRESSES[arcTestnet.id];

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
   * Get USDC balance on any supported chain
   * @param chainName - Chain name (sepolia, arbitrum, base, avalanche, polygon, arc)
   * @param address - Wallet address to check
   */
  async getChainBalance(chainName: string, address: Address): Promise<string> {
    try {
      const chain = SUPPORTED_CHAINS[chainName.toLowerCase()];
      if (!chain) {
        throw new Error(`Unsupported chain: ${chainName}. Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`);
      }

      const usdcAddress = USDC_ADDRESSES[chain.id];
      if (!usdcAddress) {
        throw new Error(`USDC address not found for chain: ${chainName}`);
      }

      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });

      const balance = await publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      return (Number(balance) / 1_000_000).toString(); // Convert from 6 decimals
    } catch (error) {
      throw new Error(`Get ${chainName} balance failed: ${error}`);
    }
  }

  /**
   * Get USDC balance on Base Sepolia
   * @param address - Wallet address to check
   */
  async getBaseBalance(address: Address): Promise<string> {
    return this.getChainBalance('base', address);
  }

  /**
   * Get USDC balance on Arbitrum Sepolia
   * @param address - Wallet address to check
   */
  async getArbitrumBalance(address: Address): Promise<string> {
    return this.getChainBalance('arbitrum', address);
  }

  /**
   * Get USDC balance on Polygon Amoy
   * @param address - Wallet address to check
   */
  async getPolygonBalance(address: Address): Promise<string> {
    return this.getChainBalance('polygon', address);
  }

  /**
   * Get USDC balance on Avalanche Fuji
   * @param address - Wallet address to check
   */
  async getAvalancheBalance(address: Address): Promise<string> {
    return this.getChainBalance('avalanche', address);
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

      // DEBUG: Log the actual API response
      console.log('Gateway Balance API Response:', JSON.stringify(data, null, 2));

      // Gateway API returns balances per domain
      // Sum up all balances to get total unified balance
      if (data && data.balances) {
        const totalBalance = Object.values(data.balances).reduce((sum: number, balance: any) => {
          return sum + Number(balance);
        }, 0);

        return (totalBalance / 1_000_000).toString(); // Convert from 6 decimals
      }

      // Check if it's a different structure
      if (data && typeof data === 'object') {
        console.log('Unexpected structure, keys:', Object.keys(data));
      }

      return '0';
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No balance found, return 0
        console.log('Gateway balance: 404 not found');
        return '0';
      }
      console.error('Gateway balance error:', error.response?.data || error.message);
      throw new Error(`Get Gateway balance failed: ${error.message || error}`);
    }
  }

  /**
   * Create and sign a burn intent for Circle Gateway transfer
   * @param amount - Amount in USDC (as string)
   * @param userAddress - User's wallet address
   * @param sourceDomain - Source chain domain ID
   * @param destinationDomain - Destination chain domain ID
   * @returns Signed burn intent with typed data and signature
   */
  async createAndSignBurnIntent(
    amount: string,
    userAddress: Address,
    sourceDomain: number = 0, // Default: Sepolia
    destinationDomain: number = 26 // Default: Arc
  ) {
    if (!this.account) {
      throw new Error('Private key not configured');
    }

    const amountInUnits = parseUnits(amount, 6);

    // EIP-712 type definitions
    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
    ];

    const TransferSpec = [
      { name: 'version', type: 'uint32' },
      { name: 'sourceDomain', type: 'uint32' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'sourceContract', type: 'bytes32' },
      { name: 'destinationContract', type: 'bytes32' },
      { name: 'sourceToken', type: 'bytes32' },
      { name: 'destinationToken', type: 'bytes32' },
      { name: 'sourceDepositor', type: 'bytes32' },
      { name: 'destinationRecipient', type: 'bytes32' },
      { name: 'sourceSigner', type: 'bytes32' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'value', type: 'uint256' },
      { name: 'salt', type: 'bytes32' },
      { name: 'hookData', type: 'bytes' },
    ];

    const BurnIntent = [
      { name: 'maxBlockHeight', type: 'uint256' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'spec', type: 'TransferSpec' },
    ];

    // Helper to convert address to bytes32
    const addressToBytes32 = (addr: string): `0x${string}` => {
      return `0x${addr.slice(2).padStart(64, '0')}` as `0x${string}`;
    };

    // Get source and destination USDC addresses based on domains
    const sourceUSDC = USDC_ADDRESSES[Object.keys(SUPPORTED_CHAINS).find(
      key => SUPPORTED_CHAINS[key].id === sourceDomain
    ) || 'sepolia'];
    const destUSDC = USDC_ADDRESSES[Object.keys(SUPPORTED_CHAINS).find(
      key => SUPPORTED_CHAINS[key].id === destinationDomain
    ) || 'arc'];

    const { randomBytes } = await import('crypto');

    const burnIntent = {
      maxBlockHeight: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
      maxFee: BigInt(2_010000), // 2.01 USDC
      spec: {
        version: 1,
        sourceDomain,
        destinationDomain,
        sourceContract: addressToBytes32(GATEWAY_WALLET_ADDRESS),
        destinationContract: addressToBytes32(GATEWAY_MINTER_ADDRESS),
        sourceToken: addressToBytes32(sourceUSDC || SEPOLIA_USDC_ADDRESS),
        destinationToken: addressToBytes32(destUSDC || ARC_USDC_ADDRESS),
        sourceDepositor: addressToBytes32(this.account.address),
        destinationRecipient: addressToBytes32(userAddress),
        sourceSigner: addressToBytes32(this.account.address),
        destinationCaller: addressToBytes32('0x0000000000000000000000000000000000000000'),
        value: amountInUnits,
        salt: `0x${randomBytes(32).toString('hex')}` as `0x${string}`,
        hookData: '0x' as `0x${string}`,
      },
    };

    const typedData = {
      types: { EIP712Domain, TransferSpec, BurnIntent },
      domain: { name: 'GatewayWallet', version: '1' },
      primaryType: 'BurnIntent' as const,
      message: burnIntent,
    };

    // Sign the burn intent
    const signature = await this.account.signTypedData(typedData);

    return { typedData, signature, burnIntent };
  }

  /**
   * Submit burn intent to Circle Gateway API
   * @param typedData - EIP-712 typed data
   * @param signature - Signature from EIP-712 signing
   * @returns Attestation and signature from Gateway API
   */
  async submitBurnIntentToGateway(typedData: any, signature: `0x${string}`) {
    const GATEWAY_API_URL = 'https://gateway-api-testnet.circle.com/v1/transfer';

    const requestBody = [
      {
        // The API expects the `typedData` object to be passed as `burnIntent`
        burnIntent: typedData.message,
        signature,
      },
    ];

    console.log('Submitting burn intent to Gateway API...');

    // Manually stringify the body with a BigInt replacer
    const jsonBody = JSON.stringify(requestBody, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );

    try {
      const response = await axios.post(GATEWAY_API_URL, jsonBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      const result = response.data;

      // Gateway API returns attestation and signature directly (no "success" field)
      if (!result.attestation || !result.signature) {
        throw new Error(`Invalid response from Gateway API: missing attestation or signature`);
      }

      console.log('Received attestation from Gateway API');
      return {
        attestation: result.attestation,
        signature: result.signature,
      };
    } catch (error: any) {
      console.error('Gateway API error:', error.response?.data || error.message);
      throw new Error(`Gateway API submission failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Mint USDC on Arc using Gateway attestation
   * @param attestation - Attestation from Gateway API
   * @param signature - Signature from Gateway API
   * @returns Transaction hash of the mint operation
   */
  async mintOnArcViaGateway(attestation: string, signature: string): Promise<string> {
    if (!this.account || !this.arcWalletClient) {
      throw new Error('Private key not configured');
    }

    console.log('Minting USDC on Arc via Gateway...');

    try {
      const mintHash = await this.arcWalletClient.writeContract({
        address: GATEWAY_MINTER_ADDRESS,
        abi: gatewayMinterAbi,
        functionName: 'gatewayMint',
        args: [attestation as `0x${string}`, signature as `0x${string}`],
        chain: undefined,
      });

      await this.arcPublicClient.waitForTransactionReceipt({ hash: mintHash });
      console.log(`Mint confirmed: ${mintHash}`);

      return mintHash;
    } catch (error: any) {
      console.error('Minting on Arc failed:', error);
      throw new Error(`Minting failed: ${error.message}`);
    }
  }

  /**
   * Complete transfer from Gateway unified balance to Arc treasury
   * This is the main method called by the API endpoint
   * @param amount - Amount in USDC
   * @param userAddress - User's wallet address
   * @param treasuryAddress - Treasury contract address
   * @returns Transaction details
   */
  async transferFromUnifiedBalanceToTreasury(
    amount: string,
    userAddress: Address,
    treasuryAddress: Address
  ) {
    console.log(`\n=== Starting Gateway Transfer: ${amount} USDC ===`);

    try {
      // Step 1: Create and sign burn intent
      console.log('Step 1/4: Creating and signing burn intent...');
      const { typedData, signature } = await this.createAndSignBurnIntent(amount, userAddress);

      // Step 2: Submit to Gateway API
      console.log('Step 2/4: Submitting to Gateway API...');
      const { attestation, signature: apiSignature } = await this.submitBurnIntentToGateway(
        typedData,
        signature
      );

      // Step 3: Mint on Arc
      console.log('Step 3/4: Minting USDC on Arc...');
      const mintTxHash = await this.mintOnArcViaGateway(attestation, apiSignature);

      // Step 4: Deposit to treasury
      console.log('Step 4/4: Depositing to Treasury...');
      const treasuryTxHash = await this.depositToTreasury(amount, treasuryAddress);

      console.log('=== Transfer Complete! ===\n');

      return {
        success: true,
        mintTxHash,
        treasuryTxHash,
        amount,
      };
    } catch (error: any) {
      console.error('Transfer failed:', error);
      throw error;
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
