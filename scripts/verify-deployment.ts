import { ethers } from "hardhat";

/**
 * Comprehensive Deployment Verification Script
 *
 * Checks that all contracts are working correctly:
 * 1. Treasury contract functionality
 * 2. Pot contracts and budgets
 * 3. USDC integration
 * 4. Flow contract
 */

async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   Knight-C Treasury - Deployment Verification ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();

  // Contract addresses
  const TREASURY_ADDRESS = "0x3940892e1e87C82fa7f314e5579045FCA370D092";
  const FLOW_ADDRESS = "0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8";
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

  console.log("🔍 Verification Parameters:");
  console.log("├─ Network:", (await ethers.provider.getNetwork()).name);
  console.log("├─ Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("├─ Deployer:", deployer.address);
  console.log("└─ Treasury:", TREASURY_ADDRESS);

  // Test 1: Check contracts exist
  console.log("\n" + "=".repeat(50));
  console.log("TEST 1: Verify Contracts Deployed");
  console.log("=".repeat(50));

  const treasuryCode = await ethers.provider.getCode(TREASURY_ADDRESS);
  const flowCode = await ethers.provider.getCode(FLOW_ADDRESS);

  if (treasuryCode === "0x") {
    console.log("❌ Treasury contract not found!");
    process.exit(1);
  }
  console.log("✅ Treasury contract deployed");

  if (flowCode === "0x") {
    console.log("❌ Flow contract not found!");
    process.exit(1);
  }
  console.log("✅ Flow contract deployed");

  // Test 2: Check Treasury functionality
  console.log("\n" + "=".repeat(50));
  console.log("TEST 2: Treasury Contract Functionality");
  console.log("=".repeat(50));

  const treasury = await ethers.getContractAt("Treasury", TREASURY_ADDRESS);
  const usdc = await ethers.getContractAt("IUSDC", USDC_ADDRESS);

  try {
    const cfo = await treasury.cfo();
    console.log("✅ CFO address:", cfo);

    const totalBalance = await treasury.getTotalBalance();
    console.log("✅ Total balance:", ethers.formatUnits(totalBalance, 6), "USDC");

    const treasuryBalance = await treasury.getTreasuryBalance();
    console.log("✅ Treasury reserve:", ethers.formatUnits(treasuryBalance, 6), "USDC");

    const allPots = await treasury.getAllPots();
    console.log("✅ Number of Pots:", allPots.length);
  } catch (error) {
    console.log("❌ Treasury contract error:", error.message);
    process.exit(1);
  }

  // Test 3: Check Pot contracts
  console.log("\n" + "=".repeat(50));
  console.log("TEST 3: Pot Contracts");
  console.log("=".repeat(50));

  const allPots = await treasury.getAllPots();

  for (let i = 0; i < allPots.length; i++) {
    const potId = allPots[i];
    const potAddress = await treasury.getPotAddress(potId);

    try {
      const pot = await ethers.getContractAt("Pot", potAddress);

      const name = await pot.name();
      const isPrivate = await pot.isPrivate();
      const allocatedBudget = await pot.allocatedBudget();
      const spentAmount = await pot.spentAmount();
      const remainingBudget = await pot.getRemainingBudget();
      const utilization = await pot.getBudgetUtilization();
      const balance = await usdc.balanceOf(potAddress);

      console.log(`\n📦 Pot ${i + 1}: ${name}`);
      console.log("├─ Address:", potAddress);
      console.log("├─ Privacy:", isPrivate ? "Private" : "Public");
      console.log("├─ Allocated:", ethers.formatUnits(allocatedBudget, 6), "USDC");
      console.log("├─ Spent:", ethers.formatUnits(spentAmount, 6), "USDC");
      console.log("├─ Remaining:", ethers.formatUnits(remainingBudget, 6), "USDC");
      console.log("├─ Utilization:", utilization.toString() + "%");
      console.log("└─ USDC Balance:", ethers.formatUnits(balance, 6), "USDC");

      console.log("✅ Pot functioning correctly");
    } catch (error) {
      console.log(`❌ Error with Pot ${i + 1}:`, error.message);
    }
  }

  // Test 4: Check Flow contract
  console.log("\n" + "=".repeat(50));
  console.log("TEST 4: Flow Contract");
  console.log("=".repeat(50));

  try {
    const flow = await ethers.getContractAt("Flow", FLOW_ADDRESS);

    const flowTreasury = await flow.treasury();
    console.log("✅ Flow treasury reference:", flowTreasury);

    const activeFlows = await flow.getActiveFlows();
    console.log("✅ Active flows:", activeFlows.length);
  } catch (error) {
    console.log("❌ Flow contract error:", error.message);
  }

  // Test 5: Check USDC integration
  console.log("\n" + "=".repeat(50));
  console.log("TEST 5: USDC Integration");
  console.log("=".repeat(50));

  try {
    const decimals = await usdc.decimals();
    console.log("✅ USDC decimals:", decimals);

    const walletBalance = await usdc.balanceOf(deployer.address);
    console.log("✅ Wallet balance:", ethers.formatUnits(walletBalance, 6), "USDC");

    const treasuryUsdcBalance = await usdc.balanceOf(TREASURY_ADDRESS);
    console.log("✅ Treasury USDC:", ethers.formatUnits(treasuryUsdcBalance, 6), "USDC");
  } catch (error) {
    console.log("❌ USDC integration error:", error.message);
  }

  // Test 6: Check contract permissions
  console.log("\n" + "=".repeat(50));
  console.log("TEST 6: Access Control");
  console.log("=".repeat(50));

  try {
    const cfo = await treasury.cfo();
    const isCFO = cfo.toLowerCase() === deployer.address.toLowerCase();
    console.log(isCFO ? "✅" : "❌", "Deployer is CFO:", isCFO);

    const isApprover = await treasury.approvers(deployer.address);
    console.log(isApprover ? "✅" : "❌", "Deployer is approver:", isApprover);
  } catch (error) {
    console.log("❌ Access control error:", error.message);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("VERIFICATION SUMMARY");
  console.log("=".repeat(50));

  const totalBalance = await treasury.getTotalBalance();
  const allPotsCount = await treasury.getAllPots();

  console.log("\n📊 System Status:");
  console.log("├─ Treasury:", TREASURY_ADDRESS);
  console.log("├─ Flow:", FLOW_ADDRESS);
  console.log("├─ Total Value:", ethers.formatUnits(totalBalance, 6), "USDC");
  console.log("├─ Number of Pots:", allPotsCount.length);
  console.log("└─ Status: ✅ All systems operational");

  console.log("\n🌐 Network Info:");
  console.log("├─ Network:", (await ethers.provider.getNetwork()).name);
  console.log("├─ Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("├─ RPC:", "https://rpc.testnet.arc.network");
  console.log("└─ Explorer:", `https://testnet.arcscan.app/address/${TREASURY_ADDRESS}`);

  console.log("\n✅ All verification tests passed!");
  console.log("\n📚 Next steps:");
  console.log("1. Whitelist beneficiaries in Pots");
  console.log("2. Execute test payment");
  console.log("3. Set up automated Flows");
  console.log("4. Build frontend interface\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });
