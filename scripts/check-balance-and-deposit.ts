#!/usr/bin/env ts-node
/**
 * Check Balance and Complete Treasury Deposit
 *
 * This script checks your USDC balance on Arc and completes
 * the treasury deposit if funds are available.
 */

import { config } from 'dotenv';
import { createWalletClient, createPublicClient, http, parseUnits, formatUnits, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

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
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
} as const;

// Configuration
const SEPOLIA_USDC = (process.env.SEPOLIA_USDC_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') as Address;
const ARC_USDC = (process.env.VITE_USDC_ADDRESS || process.env.USDC_TOKEN_ADDRESS || '0x3600000000000000000000000000000000000000') as Address;
const TREASURY_VAULT = (process.env.TREASURY_CONTRACT_ADDRESS || process.env.VITE_TREASURY_ADDRESS) as Address;
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT || '2';

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

const treasuryAbi = [
  {
    name: 'depositToTreasury',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

function logSuccess(message: string) {
  console.log(`  ✓ ${message}`);
}

function logError(message: string) {
  console.error(`  ❌ ${message}`);
}

async function checkBalancesAndDeposit() {
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
  console.log('║   Balance Check & Treasury Deposit                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  Wallet Address: ${account.address}\n`);

  // Check Sepolia USDC balance
  const sepoliaPublic = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  console.log('📊 Checking balances...\n');

  const sepoliaBalance = await sepoliaPublic.readContract({
    address: SEPOLIA_USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });

  const sepoliaBalanceFormatted = formatUnits(sepoliaBalance, 6);
  console.log(`  Sepolia USDC: ${sepoliaBalanceFormatted} USDC`);

  // Check Arc USDC balance
  const arcPublic = createPublicClient({
    chain: arcTestnet,
    transport: http('https://rpc.testnet.arc.network'),
  });

  const arcBalance = await arcPublic.readContract({
    address: ARC_USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address],
  });

  const arcBalanceFormatted = formatUnits(arcBalance, 6);
  console.log(`  Arc USDC:     ${arcBalanceFormatted} USDC\n`);

  // Check if we have enough USDC on Arc to deposit
  if (arcBalance < depositAmountUnits) {
    console.log('⏳ Status: Gateway transfer still in progress\n');
    console.log(`  Need: ${DEPOSIT_AMOUNT} USDC on Arc`);
    console.log(`  Have: ${arcBalanceFormatted} USDC on Arc\n`);
    console.log('  The cross-chain transfer typically takes 12-15 minutes.');
    console.log('  Run this script again in a few minutes to check if funds arrived.\n');
    console.log('  You can also check your balance on Arc Explorer:');
    console.log(`  https://testnet.arcscan.app/address/${account.address}\n`);
    return;
  }

  // Funds are available! Proceed with treasury deposit
  console.log('✅ USDC available on Arc! Proceeding with treasury deposit...\n');

  const arcWallet = createWalletClient({
    account,
    chain: arcTestnet,
    transport: http('https://rpc.testnet.arc.network'),
  });

  try {
    // Approve TreasuryVault
    console.log('  Approving TreasuryVault...');
    const arcApprovalHash = await arcWallet.writeContract({
      address: ARC_USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [TREASURY_VAULT, depositAmountUnits],
    });
    await arcPublic.waitForTransactionReceipt({ hash: arcApprovalHash });
    logSuccess(`Approved: https://testnet.arcscan.app/tx/${arcApprovalHash}`);

    // Deposit to Treasury
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
    console.log(`  Network: Arc Testnet (Chain ID: 5042002)\n`);
    console.log('  Next steps:');
    console.log('  1. Create departmental pots via frontend');
    console.log('  2. Allocate budgets to departments');
    console.log('  3. Begin treasury management operations\n');
  } catch (error) {
    logError(`Treasury deposit failed: ${error}`);
    process.exit(1);
  }
}

// Run the script
checkBalancesAndDeposit().catch((error) => {
  logError(`Script failed: ${error}`);
  process.exit(1);
});
