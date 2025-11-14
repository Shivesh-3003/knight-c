import { ethers } from "hardhat";

/**
 * Fund Treasury and Create Pots
 *
 * Use this after deploying contracts to:
 * 1. Transfer USDC from your wallet to Treasury
 * 2. Create departmental Pots with budgets
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  // Your deployed contract addresses
  const TREASURY_ADDRESS = "0x3940892e1e87C82fa7f314e5579045FCA370D092";
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

  console.log("╔════════════════════════════════════════════════╗");
  console.log("║         Setup Knight-C Treasury on Arc        ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  console.log("Wallet:", deployer.address);

  // Get contract instances
  const treasury = await ethers.getContractAt("Treasury", TREASURY_ADDRESS);
  const usdc = await ethers.getContractAt("IUSDC", USDC_ADDRESS);

  // Check balances
  const walletBalance = await usdc.balanceOf(deployer.address);
  const treasuryBalance = await usdc.balanceOf(TREASURY_ADDRESS);

  console.log("\n💰 Balances:");
  console.log("├─ Your Wallet:", ethers.formatUnits(walletBalance, 6), "USDC");
  console.log("└─ Treasury:", ethers.formatUnits(treasuryBalance, 6), "USDC");

  if (walletBalance === 0n) {
    console.error("\n❌ No USDC in wallet! Get from: https://faucet.circle.com");
    process.exit(1);
  }

  // Fund Treasury with USDC (use 80% of wallet balance, keep some for gas)
  const fundAmount = (walletBalance * 80n) / 100n;

  console.log("\n=== Step 1: Fund Treasury ===");
  console.log("Transferring", ethers.formatUnits(fundAmount, 6), "USDC to Treasury...");

  // Approve Treasury to spend USDC
  console.log("Approving Treasury to spend USDC...");
  const approveTx = await usdc.approve(TREASURY_ADDRESS, fundAmount);
  await approveTx.wait();
  console.log("✅ Approved");

  // Fund Treasury
  const fundTx = await treasury.fundTreasury(fundAmount);
  await fundTx.wait();
  console.log("✅ Treasury funded!");

  const newTreasuryBalance = await usdc.balanceOf(TREASURY_ADDRESS);
  console.log("New Treasury balance:", ethers.formatUnits(newTreasuryBalance, 6), "USDC");

  // Create Pots
  console.log("\n=== Step 2: Create Departmental Pots ===");

  // Create Pots with budgets based on available Treasury balance
  const potBudget = fundAmount / 3n; // Divide equally among 3 pots

  console.log("\nCreating Engineering Pot...");
  const engTx = await treasury.createPot(
    "Engineering",
    deployer.address,
    potBudget,              // Equal share
    true,                   // Private
    potBudget / 2n          // Threshold = 50% of budget
  );
  await engTx.wait();
  console.log("✅ Engineering Pot created");

  console.log("\nCreating Marketing Pot...");
  const mktTx = await treasury.createPot(
    "Marketing",
    deployer.address,
    potBudget,              // Equal share
    false,                  // Public
    potBudget / 2n          // Threshold = 50% of budget
  );
  await mktTx.wait();
  console.log("✅ Marketing Pot created");

  console.log("\nCreating Operations Pot...");
  const opsTx = await treasury.createPot(
    "Operations",
    deployer.address,
    potBudget,              // Equal share
    false,                  // Public
    potBudget / 2n          // Threshold = 50% of budget
  );
  await opsTx.wait();
  console.log("✅ Operations Pot created");

  // Get all Pot IDs
  const allPots = await treasury.getAllPots();
  console.log("\n📋 Created Pots:", allPots.length);

  // Get final balances
  const finalTreasuryBalance = await treasury.getTreasuryBalance();
  const totalBalance = await treasury.getTotalBalance();

  console.log("\n💰 Final Balances:");
  console.log("├─ Treasury Reserve:", ethers.formatUnits(finalTreasuryBalance, 6), "USDC");
  console.log("└─ Total System:", ethers.formatUnits(totalBalance, 6), "USDC");

  console.log("\n✅ Setup Complete!");
  console.log("\n📚 Next Steps:");
  console.log("1. Whitelist beneficiaries in each Pot");
  console.log("2. Execute test payments");
  console.log("3. Set up automated Flows for payroll\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
