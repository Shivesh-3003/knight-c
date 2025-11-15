#!/usr/bin/env ts-node
/**
 * Fund Treasury Via Gateway Script (CORRECTED)
 *
 * Complete end-to-end script for funding the Knight-C TreasuryVault
 * using Circle Gateway cross-chain USDC transfers.
 *
 * Flow:
 * 1. Deposit USDC to Gateway Wallet on Ethereum Sepolia (creates unified balance)
 * 2. Wait for finality (~12-15 minutes)
 * 3. Create and sign BurnIntent to transfer from unified balance to Arc
 * 4. Submit BurnIntent to Circle Gateway API to get attestation
 * 5. Call gatewayMint on Gateway Minter contract on Arc
 * 6. Deposit USDC to TreasuryVault on Arc
 *
 * Prerequisites:
 * - USDC on Ethereum Sepolia (get from https://faucet.circle.com)
 * - Sepolia ETH for gas (get from https://sepolia-faucet.com)
 * - USDC on Arc for gas (USDC is the gas token on Arc)
 * - PRIVATE_KEY in .env
 * - TREASURY_CONTRACT_ADDRESS in .env
 */

import { config } from 'dotenv';
import { createWalletClient, createPublicClient, http, parseUnits, pad, zeroAddress, type Address, hexToNumber } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { randomBytes } from 'crypto';

// Load environment variables
config();

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

// Configuration from environment variables
const SEPOLIA_USDC = (process.env.SEPOLIA_USDC_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') as Address;
const GATEWAY_WALLET = (process.env.GATEWAY_WALLET_ADDRESS || '0x0077777d7EBA4688BDeF3E311b846F25870A19B9') as Address;
const ARC_USDC = (process.env.VITE_USDC_ADDRESS || process.env.USDC_TOKEN_ADDRESS || '0x3600000000000000000000000000000000000000') as Address;
const GATEWAY_MINTER = (process.env.GATEWAY_MINTER_ADDRESS || '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B') as Address;
const TREASURY_VAULT = (process.env.TREASURY_CONTRACT_ADDRESS || process.env.VITE_TREASURY_ADDRESS) as Address;
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT || '2'; // 2 USDC default to minimize faucet usage + gas

// Gateway Domain IDs (from Circle Gateway documentation)
const SEPOLIA_DOMAIN = 0;
const ARC_DOMAIN = 26;

// Gateway API endpoint
const GATEWAY_API_URL = 'https://gateway-api-testnet.circle.com/v1/transfer';

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

// CORRECTED: Gateway Minter uses gatewayMint, not receiveMessage
const gatewayMinterAbi = [
  {
    name: 'gatewayMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'attestation', type: 'bytes' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

// Utility functions
function logStep(step: string, message: string) {
  console.log(`\n🔷 ${step}: ${message}\n`);
}

function logSuccess(message: string) {
  console.log(`  ✓ ${message}`);
}

function logWarning(message: string) {
  console.log(`  ⚠️  ${message}`);
}

function logError(message: string) {
  console.error(`  ❌ ${message}`);
}

// Helper: Convert address to bytes32
function addressToBytes32(address: Address): `0x${string}` {
  return pad(address.toLowerCase() as Address, { size: 32 });
}

// EIP-712 Type Definitions for BurnIntent
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

interface BurnIntentMessage {
  maxBlockHeight: bigint;
  maxFee: bigint;
  spec: {
    version: number;
    sourceDomain: number;
    destinationDomain: number;
    sourceContract: `0x${string}`;
    destinationContract: `0x${string}`;
    sourceToken: `0x${string}`;
    destinationToken: `0x${string}`;
    sourceDepositor: `0x${string}`;
    destinationRecipient: `0x${string}`;
    sourceSigner: `0x${string}`;
    destinationCaller: `0x${string}`;
    value: bigint;
    salt: `0x${string}`;
    hookData: `0x${string}`;
  };
}

// Create typed data for BurnIntent signing
function createBurnIntentTypedData(
  userAddress: Address,
  amount: bigint
): { types: any; domain: any; primaryType: string; message: BurnIntentMessage } {
  const domain = { name: 'GatewayWallet', version: '1' };

  // Create the burn intent
  const burnIntent: BurnIntentMessage = {
    maxBlockHeight: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), // max uint256 for 7+ days validity
    maxFee: BigInt(2_010000), // ~2.01 USDC max fee
    spec: {
      version: 1,
      sourceDomain: SEPOLIA_DOMAIN,
      destinationDomain: ARC_DOMAIN,
      sourceContract: addressToBytes32(GATEWAY_WALLET),
      destinationContract: addressToBytes32(GATEWAY_MINTER),
      sourceToken: addressToBytes32(SEPOLIA_USDC),
      destinationToken: addressToBytes32(ARC_USDC),
      sourceDepositor: addressToBytes32(userAddress),
      destinationRecipient: addressToBytes32(userAddress),
      sourceSigner: addressToBytes32(userAddress),
      destinationCaller: addressToBytes32(zeroAddress),
      value: amount,
      salt: `0x${randomBytes(32).toString('hex')}`,
      hookData: '0x' as `0x${string}`,
    },
  };

  return {
    types: { EIP712Domain, TransferSpec, BurnIntent },
    domain,
    primaryType: 'BurnIntent',
    message: burnIntent,
  };
}

// Submit burn intent to Gateway API
async function submitBurnIntent(
  burnIntentTypedData: any,
  signature: `0x${string}`
): Promise<{ attestation: string; signature: string }> {
  logStep('API CALL', 'Submitting burn intent to Circle Gateway API');

  const requestBody = [
    {
      burnIntent: burnIntentTypedData.message,
      signature,
    },
  ];

  console.log(`  Endpoint: ${GATEWAY_API_URL}`);
  console.log(`  Request body prepared with signed burn intent`);

  try {
    const response = await fetch(GATEWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gateway API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (!result.success || !result.attestation || !result.signature) {
      throw new Error('Invalid response from Gateway API: missing attestation or signature');
    }

    logSuccess('Attestation received from Gateway API!');
    return {
      attestation: result.attestation,
      signature: result.signature,
    };
  } catch (error: any) {
    logError(`Failed to submit burn intent: ${error.message}`);
    throw error;
  }
}

async function fundTreasuryViaGateway() {
  // Validate environment
  if (!process.env.PRIVATE_KEY) {
    logError('PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  if (!TREASURY_VAULT || TREASURY_VAULT === '0x0000000000000000000000000000000000000000') {
    logError('TREASURY_CONTRACT_ADDRESS not configured in .env file');
    process.exit(1);
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const depositAmountUnits = parseUnits(DEPOSIT_AMOUNT, 6);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Circle Gateway Treasury Funding Script (CORRECTED)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  Wallet Address: ${account.address}`);
  console.log(`  Treasury Address: ${TREASURY_VAULT}`);
  console.log(`  Deposit Amount: ${DEPOSIT_AMOUNT} USDC`);
  console.log(`\n  Contract Addresses:`);
  console.log(`    Sepolia USDC: ${SEPOLIA_USDC}`);
  console.log(`    Gateway Wallet: ${GATEWAY_WALLET}`);
  console.log(`    Arc USDC: ${ARC_USDC}`);
  console.log(`    Gateway Minter: ${GATEWAY_MINTER}`);
  console.log(`\n  Gateway Domains:`);
  console.log(`    Sepolia: ${SEPOLIA_DOMAIN}`);
  console.log(`    Arc Testnet: ${ARC_DOMAIN}\n`);

  // ===== STEP 1: Deposit on Sepolia to create unified balance =====
  logStep('STEP 1', 'Depositing USDC to Gateway Wallet on Sepolia');

  const sepoliaWallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const sepoliaPublic = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  let depositHash: `0x${string}`;

  try {
    // Check Sepolia USDC balance
    const sepoliaBalance = await sepoliaPublic.readContract({
      address: SEPOLIA_USDC,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const sepoliaBalanceFormatted = (Number(sepoliaBalance) / 1_000_000).toString();
    console.log(`  Current Sepolia USDC Balance: ${sepoliaBalanceFormatted} USDC`);

    if (Number(sepoliaBalance) < Number(depositAmountUnits)) {
      logError(`Insufficient USDC balance on Sepolia. Need ${DEPOSIT_AMOUNT} USDC, have ${sepoliaBalanceFormatted} USDC`);
      logWarning('Get testnet USDC from: https://faucet.circle.com');
      process.exit(1);
    }

    // 1A: Approve Gateway Wallet
    console.log('\n  Approving Gateway Wallet...');
    const approvalHash = await sepoliaWallet.writeContract({
      address: SEPOLIA_USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [GATEWAY_WALLET, depositAmountUnits],
    });
    await sepoliaPublic.waitForTransactionReceipt({ hash: approvalHash });
    logSuccess(`Approved: https://sepolia.etherscan.io/tx/${approvalHash}`);

    // 1B: Deposit USDC to Gateway Wallet (creates unified balance)
    console.log('\n  Depositing USDC to Gateway Wallet...');
    depositHash = await sepoliaWallet.writeContract({
      address: GATEWAY_WALLET,
      abi: gatewayWalletAbi,
      functionName: 'deposit',
      args: [SEPOLIA_USDC, depositAmountUnits],
    });
    await sepoliaPublic.waitForTransactionReceipt({ hash: depositHash });
    logSuccess(`Deposited: https://sepolia.etherscan.io/tx/${depositHash}`);
    logSuccess('Unified USDC balance created!');

    logWarning('Waiting for finality (~12-15 minutes)...');
    console.log('  This wait is front-loaded. Once finalized, future transfers will be instant!');
    console.log('  Monitor transaction at: https://sepolia.etherscan.io/tx/' + depositHash);
  } catch (error) {
    logError(`Sepolia deposit failed: ${error}`);
    process.exit(1);
  }

  // ===== STEP 2: Wait for finality =====
  logStep('STEP 2', 'Waiting for Sepolia finality');
  console.log('  Sepolia requires ~32 blocks (~12-15 minutes) for finality');
  console.log('  Gateway will only process after source chain finality');

  // Get the block number when deposit happened
  const depositReceipt = await sepoliaPublic.getTransactionReceipt({ hash: depositHash });
  const depositBlock = hexToNumber(depositReceipt.blockNumber);

  console.log(`  Deposit confirmed at block: ${depositBlock}`);
  console.log(`  Waiting for 32 confirmations...`);

  // Wait for 32 blocks
  let confirmedBlocks = 0;
  while (confirmedBlocks < 32) {
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds
    const currentBlock = Number(await sepoliaPublic.getBlockNumber());
    confirmedBlocks = currentBlock - depositBlock;
    console.log(`  Progress: ${confirmedBlocks}/32 blocks confirmed`);
  }

  logSuccess('Finality reached! Proceeding to burn intent...');

  // ===== STEP 3: Create and sign BurnIntent =====
  logStep('STEP 3', 'Creating and signing BurnIntent');

  const burnIntentTypedData = createBurnIntentTypedData(account.address, depositAmountUnits);

  console.log('  BurnIntent details:');
  console.log(`    Source Domain: ${SEPOLIA_DOMAIN} (Sepolia)`);
  console.log(`    Destination Domain: ${ARC_DOMAIN} (Arc Testnet)`);
  console.log(`    Amount: ${DEPOSIT_AMOUNT} USDC`);
  console.log(`    Max Fee: 2.01 USDC`);

  const signature = await account.signTypedData(burnIntentTypedData);
  logSuccess('BurnIntent signed with EIP-712');

  // ===== STEP 4: Submit to Gateway API =====
  let attestationData: { attestation: string; signature: string };
  try {
    attestationData = await submitBurnIntent(burnIntentTypedData, signature);
  } catch (error) {
    logError(`Failed to get attestation from Gateway API: ${error}`);
    process.exit(1);
  }

  // ===== STEP 5: Mint USDC on Arc =====
  logStep('STEP 5', 'Minting USDC on Arc via Gateway');

  const arcWallet = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http('https://rpc.testnet.arc.network'),
  });

  const arcPublic = createPublicClient({
    chain: arcTestnet,
    transport: http('https://rpc.testnet.arc.network'),
  });

  try {
    console.log('\n  Submitting attestation to Gateway Minter on Arc...');
    const mintHash = await arcWallet.writeContract({
      address: GATEWAY_MINTER,
      abi: gatewayMinterAbi,
      functionName: 'gatewayMint',
      args: [attestationData.attestation as `0x${string}`, attestationData.signature as `0x${string}`],
    });

    console.log(`  Minting transaction submitted: ${mintHash}`);
    await arcPublic.waitForTransactionReceipt({ hash: mintHash });
    logSuccess(`USDC minted on Arc: https://testnet.arcscan.app/tx/${mintHash}`);
  } catch (error) {
    logError(`Minting on Arc failed: ${error}`);
    logWarning('Attestation may have already been used or invalid');
    process.exit(1);
  }

  // ===== STEP 6: Deposit to TreasuryVault on Arc =====
  logStep('STEP 6', 'Funding TreasuryVault on Arc');

  try {
    // Check Arc USDC balance
    const arcBalance = await arcPublic.readContract({
      address: ARC_USDC,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const arcBalanceFormatted = (Number(arcBalance) / 1_000_000).toString();
    console.log(`  Current Arc USDC Balance: ${arcBalanceFormatted} USDC`);

    if (Number(arcBalance) < Number(depositAmountUnits)) {
      logError(`Insufficient USDC balance on Arc. Need ${DEPOSIT_AMOUNT} USDC, have ${arcBalanceFormatted} USDC`);
      logWarning('Complete Gateway transfer first');
      process.exit(1);
    }

    // 6A: Approve TreasuryVault
    console.log('\n  Approving TreasuryVault...');
    const arcApprovalHash = await arcWallet.writeContract({
      address: ARC_USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [TREASURY_VAULT, depositAmountUnits],
    });
    await arcPublic.waitForTransactionReceipt({ hash: arcApprovalHash });
    logSuccess(`Approved: https://testnet.arcscan.app/tx/${arcApprovalHash}`);

    // 6B: Deposit to Treasury
    console.log('\n  Depositing to TreasuryVault...');
    const treasuryHash = await arcWallet.writeContract({
      address: TREASURY_VAULT,
      abi: treasuryAbi,
      functionName: 'depositToTreasury',
      args: [depositAmountUnits],
    });
    await arcPublic.waitForTransactionReceipt({ hash: treasuryHash });
    logSuccess(`Treasury funded: https://testnet.arcscan.app/tx/${treasuryHash}`);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ Treasury Funding Complete via Circle Gateway!        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n  Amount: ${DEPOSIT_AMOUNT} USDC`);
    console.log(`  Treasury: ${TREASURY_VAULT}`);
    console.log(`  Network: Arc Testnet (Chain ID: 5042002)`);
    console.log('\n  Next steps:');
    console.log('  1. Create departmental pots via frontend');
    console.log('  2. Allocate budgets to departments');
    console.log('  3. Begin treasury management operations');
    console.log('\n  💡 Future transfers from unified balance will be instant (<500ms)!\n');
  } catch (error) {
    logError(`Arc deposit failed: ${error}`);
    process.exit(1);
  }
}

// Run the script
fundTreasuryViaGateway().catch((error) => {
  logError(`Script failed: ${error}`);
  process.exit(1);
});
