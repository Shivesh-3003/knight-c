#!/usr/bin/env ts-node
/**
 * Fund Treasury Via Gateway Script - Multi-Chain Support
 *
 * Complete end-to-end script for funding the Knight-C TreasuryVault
 * using Circle Gateway cross-chain USDC transfers from ANY supported chain.
 *
 * Flow:
 * 1. Deposit USDC to Gateway Wallet on source chain (creates unified balance)
 * 2. Wait for finality (~12-15 minutes, varies by chain)
 * 3. Create and sign BurnIntent to transfer from unified balance to Arc
 * 4. Submit BurnIntent to Circle Gateway API to get attestation
 * 5. Call gatewayMint on Gateway Minter contract on Arc
 * 6. Deposit USDC to TreasuryVault on Arc
 *
 * Supported Source Chains:
 * - sepolia (Ethereum Sepolia) - default
 * - base (Base Sepolia)
 * - arbitrum (Arbitrum Sepolia)
 * - polygon (Polygon Amoy)
 * - avalanche (Avalanche Fuji)
 *
 * Usage:
 *   SOURCE_CHAIN=base ts-node scripts/fund-treasury-via-gateway.ts
 *   SOURCE_CHAIN=arbitrum DEPOSIT_AMOUNT=10 ts-node scripts/fund-treasury-via-gateway.ts
 *
 * Prerequisites:
 * - USDC on source chain (get from https://faucet.circle.com)
 * - Native gas token on source chain (ETH for Sepolia/Base/Arbitrum, AVAX for Avalanche, POL for Polygon)
 * - USDC on Arc for gas (USDC is the gas token on Arc)
 * - PRIVATE_KEY in .env
 * - TREASURY_CONTRACT_ADDRESS in .env
 */

import { config } from 'dotenv';
import { createWalletClient, createPublicClient, http, parseUnits, pad, type Address, hexToNumber } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { randomBytes } from 'crypto';
import {
  getChainConfig,
  validateChainPair,
  DESTINATION_CHAIN,
  GATEWAY_WALLET_ADDRESS,
  GATEWAY_MINTER_ADDRESS,
  type SourceChain,
  SUPPORTED_SOURCE_CHAINS,
} from './chain-config';

// Load environment variables
config();

// Configuration from environment variables
const SOURCE_CHAIN = (process.env.SOURCE_CHAIN || 'sepolia') as SourceChain;
const TREASURY_VAULT = (process.env.TREASURY_CONTRACT_ADDRESS || process.env.VITE_TREASURY_ADDRESS) as Address;
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT || '5'; // 5 USDC default (need amount + 2 USDC min fee)
const SKIP_FINALITY_WAIT = process.env.SKIP_FINALITY_WAIT === 'true';

// Validate chain configuration
if (!SUPPORTED_SOURCE_CHAINS.includes(SOURCE_CHAIN)) {
  console.error(`❌ Error: Unsupported source chain "${SOURCE_CHAIN}"`);
  console.error(`   Supported chains: ${SUPPORTED_SOURCE_CHAINS.join(', ')}`);
  process.exit(1);
}

validateChainPair(SOURCE_CHAIN, DESTINATION_CHAIN);

// Get chain configurations
const sourceConfig = getChainConfig(SOURCE_CHAIN);
const destConfig = getChainConfig(DESTINATION_CHAIN);

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
    maxFee: BigInt(2_010000), // 2.01 USDC max fee (Circle Gateway requires minimum 2.0001 USDC)
    spec: {
      version: 1,
      sourceDomain: sourceConfig.domainId,
      destinationDomain: destConfig.domainId,
      sourceContract: addressToBytes32(GATEWAY_WALLET_ADDRESS),
      destinationContract: addressToBytes32(GATEWAY_MINTER_ADDRESS),
      sourceToken: addressToBytes32(sourceConfig.usdcAddress),
      destinationToken: addressToBytes32(destConfig.usdcAddress),
      sourceDepositor: addressToBytes32(userAddress),
      destinationRecipient: addressToBytes32(userAddress),
      sourceSigner: addressToBytes32(userAddress),
      destinationCaller: addressToBytes32(pad('0x0')),
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

    // Log the actual response for debugging
    console.log('\n  API Response:');
    console.log(JSON.stringify(result, null, 2));

    // Gateway API returns attestation and signature directly (no "success" field)
    if (!result.attestation || !result.signature) {
      throw new Error(`Invalid response from Gateway API: missing attestation or signature. Response: ${JSON.stringify(result)}`);
    }

    logSuccess('Attestation received from Gateway API!');
    console.log(`  Transfer ID: ${result.transferId}`);
    console.log(`  Total Fee: ${result.fees?.total} ${result.fees?.token}`);
    console.log(`  Expiration Block: ${result.expirationBlock}`);

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

  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║   Circle Gateway Treasury Funding Script - Multi-Chain Support    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(`\n  Wallet Address: ${account.address}`);
  console.log(`  Treasury Address: ${TREASURY_VAULT}`);
  console.log(`  Deposit Amount: ${DEPOSIT_AMOUNT} USDC`);
  console.log(`\n  Source Chain: ${sourceConfig.name} (Domain ${sourceConfig.domainId})`);
  console.log(`  Destination Chain: ${destConfig.name} (Domain ${destConfig.domainId})`);
  console.log(`\n  Contract Addresses:`);
  console.log(`    ${sourceConfig.name} USDC: ${sourceConfig.usdcAddress}`);
  console.log(`    ${destConfig.name} USDC: ${destConfig.usdcAddress}`);
  console.log(`    Gateway Wallet: ${GATEWAY_WALLET_ADDRESS}`);
  console.log(`    Gateway Minter: ${GATEWAY_MINTER_ADDRESS}\n`);

  // ===== STEP 1: Deposit on source chain to create unified balance =====
  logStep('STEP 1', `Depositing USDC to Gateway Wallet on ${sourceConfig.name}`);

  const sourceWallet = createWalletClient({
    account,
    chain: sourceConfig.chain,
    transport: http(),
  });

  const sourcePublic = createPublicClient({
    chain: sourceConfig.chain,
    transport: http(),
  });

  let depositHash: `0x${string}`;

  try {
    // Check source chain USDC balance
    const sourceBalance = await sourcePublic.readContract({
      address: sourceConfig.usdcAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const sourceBalanceFormatted = (Number(sourceBalance) / 1_000_000).toString();
    console.log(`  Current ${sourceConfig.name} USDC Balance: ${sourceBalanceFormatted} USDC`);

    if (Number(sourceBalance) < Number(depositAmountUnits)) {
      logError(`Insufficient USDC balance on ${sourceConfig.name}. Need ${DEPOSIT_AMOUNT} USDC, have ${sourceBalanceFormatted} USDC`);
      logWarning(`Get testnet USDC from: ${sourceConfig.faucetUrl || 'https://faucet.circle.com'}`);
      process.exit(1);
    }

    // 1A: Approve Gateway Wallet
    console.log('\n  Approving Gateway Wallet...');
    const approvalHash = await sourceWallet.writeContract({
      address: sourceConfig.usdcAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [GATEWAY_WALLET_ADDRESS, depositAmountUnits],
    });
    await sourcePublic.waitForTransactionReceipt({ hash: approvalHash });
    logSuccess(`Approved: ${sourceConfig.explorerUrl}/tx/${approvalHash}`);

    // 1B: Deposit USDC to Gateway Wallet (creates unified balance)
    console.log('\n  Depositing USDC to Gateway Wallet...');
    depositHash = await sourceWallet.writeContract({
      address: GATEWAY_WALLET_ADDRESS,
      abi: gatewayWalletAbi,
      functionName: 'deposit',
      args: [sourceConfig.usdcAddress, depositAmountUnits],
    });
    await sourcePublic.waitForTransactionReceipt({ hash: depositHash });
    logSuccess(`Deposited: ${sourceConfig.explorerUrl}/tx/${depositHash}`);
    logSuccess('Unified USDC balance created!');

    logWarning('Waiting for finality...');
    console.log('  This wait is front-loaded. Once finalized, future transfers will be instant!');
    console.log(`  Monitor transaction at: ${sourceConfig.explorerUrl}/tx/${depositHash}`);
  } catch (error) {
    logError(`${sourceConfig.name} deposit failed: ${error}`);
    process.exit(1);
  }

  // ===== STEP 2: Wait for finality =====
  logStep('STEP 2', `Waiting for ${sourceConfig.name} finality`);

  if (SKIP_FINALITY_WAIT) {
    logWarning('⚡ SKIP_FINALITY_WAIT=true - Skipping finality wait for testing');
    console.log('  ⚠️  WARNING: This may cause API errors if deposit is not actually finalized!');
    console.log('  ⚠️  Only use this flag when you have ALREADY deposited and waited for finality.');
  } else {
    console.log(`  ${sourceConfig.name} requires finality confirmation (~12-15 minutes for Ethereum chains)`);
    console.log('  Gateway will only process after source chain finality');

    // Get the block number when deposit happened
    const depositReceipt = await sepoliaPublic.getTransactionReceipt({ hash: depositHash });
    const depositBlock = Number(depositReceipt.blockNumber);

    console.log(`  Deposit confirmed at block: ${depositBlock}`);
    console.log(`  Waiting for 32 confirmations...`);

    // Wait for 32 blocks
    let confirmedBlocks = 0;
    while (confirmedBlocks < 32) {
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds
      const currentBlock = Number(await sourcePublic.getBlockNumber());
      confirmedBlocks = currentBlock - depositBlock;
      console.log(`  Progress: ${confirmedBlocks}/32 blocks confirmed`);
    }

    logSuccess('Finality reached! Proceeding to burn intent...');
  }

  // ===== STEP 3: Create and sign BurnIntent =====
  logStep('STEP 3', 'Creating and signing BurnIntent');

  const burnIntentTypedData = createBurnIntentTypedData(account.address, depositAmountUnits);

  console.log('  BurnIntent details:');
  console.log(`    Source: ${sourceConfig.name} (Domain ${sourceConfig.domainId})`);
  console.log(`    Destination: ${destConfig.name} (Domain ${destConfig.domainId})`);
  console.log(`    Amount: ${DEPOSIT_AMOUNT} USDC`);
  console.log(`    Max Fee: 2.01 USDC (Circle Gateway minimum requirement)`);

  const signature = await account.signTypedData({
    domain: burnIntentTypedData.domain,
    types: burnIntentTypedData.types,
    primaryType: burnIntentTypedData.primaryType as 'BurnIntent',
    message: burnIntentTypedData.message as any,
  });
  logSuccess('BurnIntent signed with EIP-712');

  // ===== STEP 4: Submit to Gateway API =====
  let attestationData: { attestation: string; signature: string };
  try {
    attestationData = await submitBurnIntent(burnIntentTypedData, signature);
  } catch (error) {
    logError(`Failed to get attestation from Gateway API: ${error}`);
    process.exit(1);
  }

  // ===== STEP 5: Mint USDC on destination chain =====
  logStep('STEP 5', `Minting USDC on ${destConfig.name} via Gateway`);

  const destWallet = createWalletClient({
    account,
    chain: destConfig.chain,
    transport: http(),
  });

  const destPublic = createPublicClient({
    chain: destConfig.chain,
    transport: http(),
  });

  try {
    console.log(`\n  Submitting attestation to Gateway Minter on ${destConfig.name}...`);
    const mintHash = await destWallet.writeContract({
      address: GATEWAY_MINTER_ADDRESS,
      abi: gatewayMinterAbi,
      functionName: 'gatewayMint',
      args: [attestationData.attestation as `0x${string}`, attestationData.signature as `0x${string}`],
    });

    console.log(`  Minting transaction submitted: ${mintHash}`);
    await destPublic.waitForTransactionReceipt({ hash: mintHash });
    logSuccess(`USDC minted on ${destConfig.name}: ${destConfig.explorerUrl}/tx/${mintHash}`);
  } catch (error) {
    logError(`Minting on ${destConfig.name} failed: ${error}`);
    logWarning('Attestation may have already been used or invalid');
    process.exit(1);
  }

  // ===== STEP 6: Deposit to TreasuryVault =====
  logStep('STEP 6', `Funding TreasuryVault on ${destConfig.name}`);

  try {
    // Check destination chain USDC balance
    const destBalance = await destPublic.readContract({
      address: destConfig.usdcAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const destBalanceFormatted = (Number(destBalance) / 1_000_000).toString();
    console.log(`  Current ${destConfig.name} USDC Balance: ${destBalanceFormatted} USDC`);

    if (Number(destBalance) < Number(depositAmountUnits)) {
      logError(`Insufficient USDC balance on ${destConfig.name}. Need ${DEPOSIT_AMOUNT} USDC, have ${destBalanceFormatted} USDC`);
      logWarning('Complete Gateway transfer first');
      process.exit(1);
    }

    // 6A: Approve TreasuryVault
    console.log('\n  Approving TreasuryVault...');
    const treasuryApprovalHash = await destWallet.writeContract({
      address: destConfig.usdcAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [TREASURY_VAULT, depositAmountUnits],
    });
    await destPublic.waitForTransactionReceipt({ hash: treasuryApprovalHash });
    logSuccess(`Approved: ${destConfig.explorerUrl}/tx/${treasuryApprovalHash}`);

    // 6B: Deposit to Treasury
    console.log('\n  Depositing to TreasuryVault...');
    const treasuryHash = await destWallet.writeContract({
      address: TREASURY_VAULT,
      abi: treasuryAbi,
      functionName: 'depositToTreasury',
      args: [depositAmountUnits],
    });
    await destPublic.waitForTransactionReceipt({ hash: treasuryHash });
    logSuccess(`Treasury funded: ${destConfig.explorerUrl}/tx/${treasuryHash}`);

    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ Treasury Funding Complete via Circle Gateway!                ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log(`\n  Amount: ${DEPOSIT_AMOUNT} USDC`);
    console.log(`  Treasury: ${TREASURY_VAULT}`);
    console.log(`  Network: ${destConfig.name} (Chain ID: ${destConfig.chain.id})`);
    console.log(`  Source: ${sourceConfig.name} (Domain ${sourceConfig.domainId})`);
    console.log(`  Destination: ${destConfig.name} (Domain ${destConfig.domainId})`);
    console.log('\n  Next steps:');
    console.log('  1. Create departmental pots via frontend');
    console.log('  2. Allocate budgets to departments');
    console.log('  3. Begin treasury management operations');
    console.log('\n  💡 Future transfers from unified balance will be instant (<500ms)!\n');
  } catch (error) {
    logError(`${destConfig.name} deposit failed: ${error}`);
    process.exit(1);
  }
}

// Run the script
fundTreasuryViaGateway().catch((error) => {
  logError(`Script failed: ${error}`);
  process.exit(1);
});
