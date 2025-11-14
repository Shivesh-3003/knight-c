import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.arc-testnet.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 12345, // TODO: Replace with actual Arc testnet chain ID
    },
  },
  etherscan: {
    apiKey: {
      arcTestnet: process.env.ARC_EXPLORER_API_KEY || "your-api-key",
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 12345,
        urls: {
          apiURL: "https://api.explorer.arc-testnet.network/api",
          browserURL: "https://explorer.arc-testnet.network",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    token: "USDC",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
