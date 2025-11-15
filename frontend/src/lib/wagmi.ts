import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { injected, walletConnect, coinbaseWallet, metaMask } from "wagmi/connectors";
import { ARC_TESTNET_CHAIN_ID } from "./constants";

// Arc Testnet Chain Definition
export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6, // Display purposes - Arc uses USDC as gas
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
    public: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

// Wagmi Configuration
export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Knight-C Treasury",
        url: "https://knight-c.app",
      },
    }),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "dummy-project-id",
      showQrModal: true,
      metadata: {
        name: "Knight-C Treasury",
        description: "Multi-Signature Treasury Management",
        url: typeof window !== 'undefined' && import.meta.env.DEV
          ? window.location.origin
          : "https://knight-c.app",
        icons: ["https://knight-c.app/icon.png"],
      },
    }),
    coinbaseWallet({
      appName: "Knight-C Treasury",
      appLogoUrl: "https://knight-c.app/icon.png",
    }),
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0]),
  },
});

// Treasury Contract ABI (only the functions we need)
export const treasuryVaultABI = [
  {
    type: "function",
    name: "createPot",
    stateMutability: "nonpayable",
    inputs: [
      { name: "potId", type: "bytes32" },
      { name: "budget", type: "uint256" },
      { name: "_approvers", type: "address[]" },
      { name: "threshold", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submitPayment",
    stateMutability: "nonpayable",
    inputs: [
      { name: "potId", type: "bytes32" },
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    outputs: [{ name: "txHash", type: "bytes32" }],
  },
  {
    type: "function",
    name: "approvePayment",
    stateMutability: "nonpayable",
    inputs: [{ name: "txHash", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "reallocate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "fromPot", type: "bytes32" },
      { name: "toPot", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getPotDetails",
    stateMutability: "view",
    inputs: [{ name: "potId", type: "bytes32" }],
    outputs: [
      { name: "budget", type: "uint256" },
      { name: "spent", type: "uint256" },
      { name: "threshold", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getTreasuryBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "addBeneficiary",
    stateMutability: "nonpayable",
    inputs: [
      { name: "potId", type: "bytes32" },
      { name: "beneficiary", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "depositToTreasury",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "pendingQueue",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "pending",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "potId", type: "bytes32" },
      { name: "recipients", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "approvalCount", type: "uint256" },
      { name: "executed", type: "bool" },
    ],
  },
  {
    type: "event",
    name: "PaymentExecuted",
    inputs: [
      { name: "potId", type: "bytes32", indexed: true },
      { name: "recipient", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BudgetReallocated",
    inputs: [
      { name: "fromPot", type: "bytes32", indexed: true },
      { name: "toPot", type: "bytes32", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

// Export treasury contract configuration
export const treasuryContract = {
  abi: treasuryVaultABI,
  chainId: arcTestnet.id,
} as const;

// Helper functions
export function isCorrectNetwork(chainId: number | undefined): boolean {
  return chainId === ARC_TESTNET_CHAIN_ID;
}

export function getNetworkName(chainId: number | undefined): string {
  if (chainId === ARC_TESTNET_CHAIN_ID) return "Arc Testnet";
  return `Unknown Network (${chainId})`;
}
