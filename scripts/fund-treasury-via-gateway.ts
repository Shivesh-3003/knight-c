#!/usr/bin/env ts-node
/**
 * Fund Treasury Via Gateway Script
 *
 * Complete end-to-end script for funding the Knight-C TreasuryVault
 * using Circle Gateway cross-chain USDC transfers.
 *
 * Flow:
 * 1. Deposit USDC to Gateway Wallet on Ethereum Sepolia
 * 2. Wait for finality (~12-15 minutes)
 * 3. Fetch attestation from Circle Gateway API
 * 4. Submit attestation to Gateway Minter on Arc
 * 5. Deposit USDC to TreasuryVault on Arc
 *
 * Prerequisites:
 * - USDC on Ethereum Sepolia (get from https://faucet.circle.com)
 * - Sepolia ETH for gas (get from https://sepolia-faucet.com)
 * - USDC on Arc for gas (USDC is the gas token on Arc)
 * - PRIVATE_KEY in .env
 * - TREASURY_CONTRACT_ADDRESS in .env
 */

import { config } from 'dotenv';
import { createWalletClient, createPublicClient, http, parseUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

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

// Configuration
const SEPOLIA_USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Address;
const GATEWAY_WALLET = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as Address;
const ARC_USDC = '0x3600000000000000000000000000000000000000' as Address;
const GATEWAY_MINTER = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as Address;
const TREASURY_VAULT = (process.env.TREASURY_CONTRACT_ADDRESS || process.env.VITE_TREASURY_ADDRESS) as Address;
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT || '1000'; // 1000 USDC default

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
  console.log('║   Circle Gateway Treasury Funding Script                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  Wallet Address: ${account.address}`);
  console.log(`  Treasury Address: ${TREASURY_VAULT}`);
  console.log(`  Deposit Amount: ${DEPOSIT_AMOUNT} USDC\n`);

  // ===== STEP 1: Deposit on Sepolia =====
  logStep('STEP 1', 'Depositing USDC to Gateway on Sepolia');

  const sepoliaWallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const sepoliaPublic = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

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

    // 1B: Deposit USDC
    console.log('\n  Depositing USDC to Gateway Wallet...');
    const depositHash = await sepoliaWallet.writeContract({
      address: GATEWAY_WALLET,
      abi: gatewayWalletAbi,
      functionName: 'deposit',
      args: [SEPOLIA_USDC, depositAmountUnits],
    });
    await sepoliaPublic.waitForTransactionReceipt({ hash: depositHash });
    logSuccess(`Deposited: https://sepolia.etherscan.io/tx/${depositHash}`);

    logWarning('Waiting for finality (~12-15 minutes)...');
    console.log('  Monitor transaction at: https://sepolia.etherscan.io/tx/' + depositHash);
  } catch (error) {
    logError(`Sepolia deposit failed: ${error}`);
    process.exit(1);
  }

  // ===== STEP 2: Wait for Gateway (Manual Step) =====
  logStep('STEP 2', 'Gateway Processing');
  console.log('  Gateway will automatically:');
  console.log('  1. Detect deposit finality on Sepolia');
  console.log('  2. Credit your unified USDC balance');
  console.log('  3. Enable instant transfers to Arc');

  logWarning('MANUAL ACTION REQUIRED:');
  console.log('  Use Circle Gateway dashboard or API to transfer USDC to Arc');
  console.log('  Destination address: ' + account.address);
  console.log('\n  Press any key to continue after Gateway transfer completes...');

  // Wait for user input
  await new Promise((resolve) => {
    process.stdin.once('data', () => resolve(null));
  });

  // ===== STEP 3: Deposit to TreasuryVault on Arc =====
  logStep('STEP 3', 'Funding TreasuryVault on Arc');

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

    // 3A: Approve TreasuryVault
    console.log('\n  Approving TreasuryVault...');
    const arcApprovalHash = await arcWallet.writeContract({
      address: ARC_USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [TREASURY_VAULT, depositAmountUnits],
    });
    await arcPublic.waitForTransactionReceipt({ hash: arcApprovalHash });
    logSuccess(`Approved: https://testnet.arcscan.app/tx/${arcApprovalHash}`);

    // 3B: Deposit to Treasury
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
    console.log('║   ✅ Treasury Funding Complete!                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n  Amount: ${DEPOSIT_AMOUNT} USDC`);
    console.log(`  Treasury: ${TREASURY_VAULT}`);
    console.log(`  Network: Arc Testnet (Chain ID: 5042002)`);
    console.log('\n  Next steps:');
    console.log('  1. Create departmental pots via frontend');
    console.log('  2. Allocate budgets to departments');
    console.log('  3. Begin treasury management operations\n');
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
