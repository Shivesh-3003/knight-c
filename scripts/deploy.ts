import hre from "hardhat";

/**
 * Knight-C Deployment Script for Arc Network
 * Deploys TreasuryVault contract only
 *
 * Prerequisites:
 * - Wallet funded with USDC for gas (get from https://faucet.circle.com)
 * - PRIVATE_KEY in .env
 * - Connected to Arc Testnet
 */
async function main() {
  console.log("Deploying TreasuryVault to Arc Network...\n");

  const TreasuryVault = await hre.ethers.getContractFactory("TreasuryVault");
  const vault = await TreasuryVault.deploy();
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("✅ TreasuryVault deployed to:", vaultAddress);

  console.log("\n📚 Next Steps:");
  console.log("1. Update .env with TREASURY_ADDRESS=" + vaultAddress);
  console.log("2. Run setup script: npx hardhat run scripts/setup.ts --network arc");
  console.log("3. Fund treasury with depositToTreasury()");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
