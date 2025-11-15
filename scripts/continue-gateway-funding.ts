#!/usr/bin/env ts-node
/**
 * Continue Gateway Funding Script
 *
 * Use this script to continue the treasury funding process after
 * the Sepolia deposit has been made. It extracts the message hash
 * from the transaction logs and continues from Step 2.
 */

import { config } from 'dotenv';
import { createWalletClient, createPublicClient, http, parseUnits, type Address, decodeEventLog } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import axios from 'axios';

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
const ARC_USDC = (process.env.VITE_USDC_ADDRESS || process.env.USDC_TOKEN_ADDRESS || '0x3600000000000000000000000000000000000000') as Address;
const GATEWAY_MINTER = (process.env.GATEWAY_MINTER_ADDRESS || '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B') as Address;
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

// MessageSent event from CCTP TokenMessenger contract
const messageSentEventAbi = {
  type: 'event',
  name: 'MessageSent',
  inputs: [
    { name: 'message', type: 'bytes', indexed: false },
  ],
} as const;

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

async function extractMessageHashFromTx(txHash: `0x${string}`): Promise<string> {
  const sepoliaPublic = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  console.log('  Fetching transaction receipt...');
  const receipt = await sepoliaPublic.getTransactionReceipt({ hash: txHash });

  console.log(`  Found ${receipt.logs.length} logs in transaction`);

  // Look for MessageSent event in logs
  for (const log of receipt.logs) {
    try {
      // Try to decode as MessageSent event
      const decoded = decodeEventLog({
        abi: [messageSentEventAbi],
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === 'MessageSent') {
        const messageBytes = decoded.args.message as `0x${string}`;
        // Calculate keccak256 hash of the message
        const { keccak256 } = await import('viem');
        const messageHash = keccak256(messageBytes);
        logSuccess(`Extracted message hash: ${messageHash}`);
        return messageHash;
      }
    } catch (e) {
      // Not a MessageSent event, continue
      continue;
    }
  }

  throw new Error('MessageSent event not found in transaction logs');
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
      const apiUrl = `https://iris-api-sandbox.circle.com/attestations/${messageHash}`;
      const response = await axios.get(apiUrl);

      const data = response.data;

      if (data.status === 'complete' && data.attestation) {
        logSuccess('Attestation received!');
        return { message: messageHash, attestation: data.attestation };
      } else {
        console.log(`  Attempt ${attempt}/${maxAttempts}: Status = ${data.status || 'pending'}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`  Attempt ${attempt}/${maxAttempts}: Attestation not yet available`);
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

async function continueGatewayFunding(sepoliaTxHash: `0x${string}`) {
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
  console.log('║   Continue Gateway Treasury Funding                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n  Wallet Address: ${account.address}`);
  console.log(`  Treasury Address: ${TREASURY_VAULT}`);
  console.log(`  Sepolia Tx: ${sepoliaTxHash}`);
  console.log(`  Deposit Amount: ${DEPOSIT_AMOUNT} USDC\n`);

  // Extract message hash from transaction
  logStep('STEP 1', 'Extracting Message Hash from Transaction');
  let messageHash: string;
  try {
    messageHash = await extractMessageHashFromTx(sepoliaTxHash);
  } catch (error) {
    logError(`Failed to extract message hash: ${error}`);
    process.exit(1);
  }

  // Fetch attestation
  logStep('STEP 2', 'Fetching Circle Attestation');
  let attestationData: { message: string; attestation: string };
  try {
    attestationData = await pollForAttestation(messageHash);
  } catch (error) {
    logError(`Failed to retrieve attestation: ${error}`);
    logWarning('The attestation may not be ready yet. Wait a few more minutes and try again.');
    process.exit(1);
  }

  // Mint USDC on Arc
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

  // Deposit to TreasuryVault on Arc
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

    // Approve TreasuryVault
    console.log('\n  Approving TreasuryVault...');
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
  } catch (error) {
    logError(`Arc deposit failed: ${error}`);
    process.exit(1);
  }
}

// Get transaction hash from command line argument
const sepoliaTxHash = process.argv[2] as `0x${string}`;

if (!sepoliaTxHash || !sepoliaTxHash.startsWith('0x')) {
  console.error('\nUsage: ts-node scripts/continue-gateway-funding.ts <sepolia-tx-hash>');
  console.error('Example: ts-node scripts/continue-gateway-funding.ts 0xdf8f2809b10ce47e9d33569d2d787d791587117c764360b234c0780b2e5d7c7b\n');
  process.exit(1);
}

// Run the script
continueGatewayFunding(sepoliaTxHash).catch((error) => {
  logError(`Script failed: ${error}`);
  process.exit(1);
});
