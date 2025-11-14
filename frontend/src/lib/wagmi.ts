import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';

// Arc testnet configuration
const arcTestnet = {
  id: 12345, // TODO: Replace with actual Arc testnet chain ID
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: { http: ['https://rpc.arc-testnet.network'] }, // TODO: Replace with actual Arc RPC URL
    public: { http: ['https://rpc.arc-testnet.network'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer.arc-testnet.network' },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'Knight-C',
  projectId: 'YOUR_PROJECT_ID', // TODO: Replace with WalletConnect project ID
  chains: [arcTestnet as any],
  transports: {
    [arcTestnet.id]: http(),
  },
});
