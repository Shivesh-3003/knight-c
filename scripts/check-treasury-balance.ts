// Quick script to check Treasury USDC balance on Arc
import { config } from 'dotenv';
import { createPublicClient, http, parseAbi } from 'viem';

config({ path: require('path').resolve(__dirname, '../.env') });

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { decimals: 6, name: 'USDC', symbol: 'USDC' },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  testnet: true,
} as const;

const TREASURY_ADDRESS = process.env.TREASURY_CONTRACT_ADDRESS || '0x4094b8392d2Ca5A72185C341b6bbDcBA2f8404a4';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

const erc20Abi = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

async function main() {
  const client = createPublicClient({
    chain: arcTestnet,
    transport: http('https://rpc.testnet.arc.network'),
  });

  console.log('Checking Treasury USDC balance...');
  console.log('Treasury Address:', TREASURY_ADDRESS);
  console.log('USDC Token:', USDC_ADDRESS);
  console.log('');

  const balance = await client.readContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [TREASURY_ADDRESS as `0x${string}`],
  });

  const balanceFormatted = (Number(balance) / 1_000_000).toFixed(6);

  console.log('Treasury USDC Balance:', balanceFormatted, 'USDC');
  console.log('Raw balance (6 decimals):', balance.toString());
}

main().catch(console.error);
