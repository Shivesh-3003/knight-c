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
import axios from 'axios';

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
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT || '2'; // 2 USDC default to minimize faucet usage + gas

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

async function pollForAttestation(
  messageHash: string,
  maxAttempts: number = 30,
  intervalSeconds: number = 30
): Promise<{ message: string; attestation: string }> {
  const circleApiKey = process.env.CIRCLE_API_KEY;
  if (!circleApiKey) {
    throw new Error('CIRCLE_API_KEY not found in .env file');
  }

  console.log(`  Polling for attestation (max ${maxAttempts} attempts, ${intervalSeconds}s interval)...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const apiUrl = `https://api.circle.com/v1/w3s/transfers/${messageHash}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${circleApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      if (data.status === 'complete' && data.attestation && data.message) {
        logSuccess('Attestation received!');
        return { message: data.message, attestation: data.attestation };
      } else {
        console.log(`  Attempt ${attempt}/${maxAttempts}: Status = ${data.status || 'pending'}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`  Attempt ${attempt}/${maxAttempts}: Transfer not yet finalized`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Circle API authentication failed. Check your CIRCLE_API_KEY.');
      } else {
        console.log(`  Attempt ${attempt}/${maxAttempts}: ${error.message}`);
      }
    }

    if (attempt < maxAttempts) {
      console.log(`  Waiting ${intervalSeconds} seconds before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
    }
  }

  throw new Error(`Attestation not received after ${maxAttempts} attempts.`);
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

    // 1B: Deposit USDC
    console.log('\n  Depositing USDC to Gateway Wallet...');
    depositHash = await sepoliaWallet.writeContract({
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

  // ===== STEP 2: Fetch Attestation =====
  logStep('STEP 2', 'Fetching Gateway Attestation');
  console.log('  Waiting for Sepolia finality and Gateway attestation...');
  console.log('  This typically takes 12-15 minutes (~32 blocks on Sepolia)');

  let attestationData: { message: string; attestation: string };
  try {
    attestationData = await pollForAttestation(depositHash);
  } catch (error) {
    logError(`Failed to retrieve attestation: ${error}`);
    logWarning('You can retry later using the transaction hash: ' + depositHash);
    process.exit(1);
  }

  // ===== STEP 3: Minting USDC on Arc =====
  logStep('STEP 3', 'Minting USDC on Arc');

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
      functionName: 'receiveMessage',
      args: [attestationData.message as `0x${string}`, attestationData.attestation as `0x${string}`],
    });

    console.log(`  Minting transaction submitted: ${mintHash}`);
    await arcPublic.waitForTransactionReceipt({ hash: mintHash });
    logSuccess(`USDC minted on Arc: https://testnet.arcscan.app/tx/${mintHash}`);
  } catch (error) {
    logError(`Minting on Arc failed: ${error}`);
    logWarning('Attestation may have already been used or invalid');
    process.exit(1);
  }

  // ===== STEP 4: Deposit to TreasuryVault on Arc =====
  logStep('STEP 4', 'Funding TreasuryVault on Arc');

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
