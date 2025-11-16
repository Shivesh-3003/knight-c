// Chain configuration for Circle Gateway multi-chain support
// Documentation: https://developers.circle.com/gateway

import { type Address } from 'viem';
import { sepolia, arbitrumSepolia, baseSepolia, avalancheFuji, polygonAmoy } from 'viem/chains';

// Arc Testnet Chain Configuration (not in viem standard chains)
export const arcTestnet = {
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
      http: ['https://yolo-dawn-dawn.arc-testnet.quiknode.pro/e36c7d844dd8d0e0ffa1c1eca5860be2e8d09083'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://yolo-dawn-dawn.arc-testnet.quiknode.pro/e36c7d844dd8d0e0ffa1c1eca5860be2e8d09083'],
      webSocket: ['wss://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
} as const;

// Override for Base Sepolia to use flashblocks-aware RPC
const baseSepoliaWithFlashblocks = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: {
      http: ['https://sepolia-preconf.base.org'], // Flashblocks-aware RPC
    },
  },
} as const;

export interface ChainConfig {
  chain: any; // viem chain object
  domainId: number; // Circle Gateway domain ID
  usdcAddress: Address;
  name: string;
  faucetUrl?: string;
  explorerUrl: string;
}

// Circle Gateway Testnet Chain Configurations
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  sepolia: {
    chain: sepolia,
    domainId: 0,
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    name: 'Ethereum Sepolia',
    faucetUrl: 'https://faucet.circle.com',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  avalanche: {
    chain: avalancheFuji,
    domainId: 1,
    usdcAddress: '0x5425890298aed601595a70ab815c96711a31bc65',
    name: 'Avalanche Fuji',
    faucetUrl: 'https://faucet.circle.com',
    explorerUrl: 'https://testnet.snowtrace.io',
  },
  arbitrum: {
    chain: arbitrumSepolia,
    domainId: 3,
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    name: 'Arbitrum Sepolia',
    faucetUrl: 'https://faucet.circle.com',
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  base: {
    chain: baseSepoliaWithFlashblocks,
    domainId: 6,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    name: 'Base Sepolia',
    faucetUrl: 'https://faucet.circle.com',
    explorerUrl: 'https://sepolia.basescan.org',
  },
  polygon: {
    chain: polygonAmoy,
    domainId: 7,
    usdcAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    name: 'Polygon Amoy',
    faucetUrl: 'https://faucet.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
  },
  arc: {
    chain: arcTestnet,
    domainId: 26,
    usdcAddress: '0x3600000000000000000000000000000000000000',
    name: 'Arc Testnet',
    faucetUrl: 'https://faucet.circle.com',
    explorerUrl: 'https://testnet.arcscan.app',
  },
};

// Gateway Contract Addresses (same across all testnets)
export const GATEWAY_WALLET_ADDRESS = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9' as Address;
export const GATEWAY_MINTER_ADDRESS = '0x0022222ABE238Cc2C7Bb1f21003F0a260052475B' as Address;

// Supported source chains for deposits
export const SUPPORTED_SOURCE_CHAINS = ['sepolia', 'avalanche', 'arbitrum', 'base', 'polygon'] as const;
export type SourceChain = typeof SUPPORTED_SOURCE_CHAINS[number];

// Destination chain (Arc Testnet for treasury)
export const DESTINATION_CHAIN = 'arc';

/**
 * Get chain configuration by name
 */
export function getChainConfig(chainName: string): ChainConfig {
  const config = CHAIN_CONFIGS[chainName.toLowerCase()];
  if (!config) {
    throw new Error(
      `Unknown chain: ${chainName}. Supported chains: ${Object.keys(CHAIN_CONFIGS).join(', ')}`
    );
  }
  return config;
}

/**
 * Validate source and destination chain combination
 */
export function validateChainPair(source: string, destination: string): void {
  if (source === destination) {
    throw new Error('Source and destination chains must be different');
  }

  const sourceConfig = getChainConfig(source);
  const destConfig = getChainConfig(destination);

  if (!sourceConfig || !destConfig) {
    throw new Error('Invalid chain configuration');
  }
}

/**
 * Get all available source chains for deposits
 */
export function getAvailableSourceChains(): ChainConfig[] {
  return SUPPORTED_SOURCE_CHAINS.map((chain) => CHAIN_CONFIGS[chain]);
}
