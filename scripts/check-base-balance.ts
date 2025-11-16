#!/usr/bin/env ts-node
/**
 * Quick script to check balances on Base Sepolia before funding treasury
 */

import { createPublicClient, http, parseAbi, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { config } from 'dotenv';

config();

const BASE_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address;

const baseSepoliaWithFlashblocks = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: {
      http: ['https://sepolia-preconf.base.org'],
    },
  },
} as const;

async function checkBalances() {
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env');
    process.exit(1);
  }

  // Derive address from private key
  const { privateKeyToAccount } = await import('viem/accounts');
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const address = account.address;

  const client = createPublicClient({
    chain: baseSepoliaWithFlashblocks,
    transport: http(),
  });

  console.log('\n📊 Base Sepolia Balance Check');
  console.log('=====================================');
  console.log(`Wallet: ${address}\n`);

  try {
    // Check ETH balance
    const ethBalance = await client.getBalance({ address });
    const ethFormatted = (Number(ethBalance) / 1e18).toFixed(6);

    // Check USDC balance
    const usdcBalance = await client.readContract({
      address: BASE_USDC,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [address],
    });
    const usdcFormatted = (Number(usdcBalance) / 1_000_000).toFixed(6);

    console.log(`ETH:  ${ethFormatted} ETH`);
    console.log(`USDC: ${usdcFormatted} USDC\n`);

    // Check if ready to run script
    const needsUsdc = Number(usdcBalance) < 7_000_000; // Need at least 7 USDC (5 + 2 for fee)
    const needsEth = Number(ethBalance) < 0.001e18; // Need at least 0.001 ETH for gas

    if (needsUsdc || needsEth) {
      console.log('⚠️  You need more tokens:\n');
      if (needsUsdc) {
        console.log('   • Get USDC: https://faucet.circle.com (select Base Sepolia)');
        console.log(`     Current: ${usdcFormatted} USDC | Need: 7+ USDC\n`);
      }
      if (needsEth) {
        console.log('   • Get ETH: https://www.alchemy.com/faucets/base-sepolia');
        console.log(`     Current: ${ethFormatted} ETH | Need: 0.001+ ETH\n`);
      }
    } else {
      console.log('✅ Ready to fund treasury from Base Sepolia!\n');
      console.log('Run: SOURCE_CHAIN=base ts-node scripts/fund-treasury-via-gateway.ts\n');
    }

  } catch (error) {
    console.error('❌ Error checking balances:', error);
    process.exit(1);
  }
}

checkBalances();
