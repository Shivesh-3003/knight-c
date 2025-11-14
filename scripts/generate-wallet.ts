import { ethers } from "hardhat";

/**
 * Generate a new wallet for Arc Network deployment
 *
 * IMPORTANT: Save the private key securely!
 * Get testnet USDC from: https://faucet.circle.com
 */
async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║        Generate New Wallet for Arc Network    ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("✅ New wallet generated!\n");
  console.log("📋 Wallet Details:");
  console.log("├─ Address:", wallet.address);
  console.log("└─ Private Key:", wallet.privateKey);

  console.log("\n⚠️  IMPORTANT:");
  console.log("1. Save your private key securely!");
  console.log("2. Add it to your .env file:");
  console.log(`   PRIVATE_KEY=${wallet.privateKey}`);
  console.log("\n3. Get testnet USDC for gas:");
  console.log("   Visit: https://faucet.circle.com");
  console.log("   Select: Arc Testnet");
  console.log(`   Address: ${wallet.address}`);
  console.log("\n4. NEVER commit your .env file to git!");
  console.log("\n⚡ Arc Network:");
  console.log("   Chain ID: 5042002");
  console.log("   RPC: https://rpc.testnet.arc.network");
  console.log("   Gas Token: USDC (not ETH!)\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
