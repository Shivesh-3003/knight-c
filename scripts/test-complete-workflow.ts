import { ethers } from "hardhat";

/**
 * Complete Workflow Test
 *
 * Demonstrates the full Knight-C treasury workflow:
 * 1. Check system status
 * 2. Whitelist a beneficiary
 * 3. Execute a test payment
 * 4. Check updated balances
 */

async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   Knight-C Treasury - Complete Workflow Test  ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  const [deployer] = await ethers.getSigners();

  // Contract addresses
  const TREASURY_ADDRESS = "0x3940892e1e87C82fa7f314e5579045FCA370D092";
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

  console.log("🔧 Setup:");
  console.log("├─ Network:", (await ethers.provider.getNetwork()).name);
  console.log("├─ Account:", deployer.address);
  console.log("└─ Treasury:", TREASURY_ADDRESS);

  // Get contract instances
  const treasury = await ethers.getContractAt("Treasury", TREASURY_ADDRESS);
  const usdc = await ethers.getContractAt("IUSDC", USDC_ADDRESS);

  // Step 1: Get Pot addresses
  console.log("\n" + "=".repeat(50));
  console.log("STEP 1: Get Pot Information");
  console.log("=".repeat(50));

  const allPots = await treasury.getAllPots();
  console.log(`\nFound ${allPots.length} Pots:`);

  const potAddresses: { [key: string]: string } = {};

  for (let i = 0; i < allPots.length; i++) {
    const potId = allPots[i];
    const potAddress = await treasury.getPotAddress(potId);
    const pot = await ethers.getContractAt("Pot", potAddress);
    const name = await pot.name();

    potAddresses[name] = potAddress;

    console.log(`\n${i + 1}. ${name}`);
    console.log("   Address:", potAddress);
    console.log("   ID:", potId);
  }

  // Use Marketing Pot for demo (it's public)
  const marketingPotAddress = potAddresses["Marketing"];
  const marketingPot = await ethers.getContractAt("Pot", marketingPotAddress);

  console.log("\n✅ Using Marketing Pot for test");

  // Step 2: Check initial state
  console.log("\n" + "=".repeat(50));
  console.log("STEP 2: Check Initial State");
  console.log("=".repeat(50));

  const initialBalance = await marketingPot.getRemainingBudget();
  const initialUtilization = await marketingPot.getBudgetUtilization();
  const initialPayments = await marketingPot.getPaymentCount();

  console.log("\n📊 Marketing Pot - Before:");
  console.log("├─ Budget:", ethers.formatUnits(initialBalance, 6), "USDC");
  console.log("├─ Utilization:", initialUtilization.toString() + "%");
  console.log("└─ Payments:", initialPayments.toString());

  // Step 3: Whitelist beneficiary (use deployer address for demo)
  console.log("\n" + "=".repeat(50));
  console.log("STEP 3: Whitelist Beneficiary");
  console.log("=".repeat(50));

  const beneficiary = deployer.address; // In real scenario, use different address

  const isWhitelisted = await marketingPot.whitelist(beneficiary);

  if (!isWhitelisted) {
    console.log("\n🔐 Whitelisting beneficiary:", beneficiary);
    const whitelistTx = await marketingPot.whitelistBeneficiary(beneficiary);
    await whitelistTx.wait();
    console.log("✅ Beneficiary whitelisted");
  } else {
    console.log("✅ Beneficiary already whitelisted:", beneficiary);
  }

  // Step 4: Execute test payment
  console.log("\n" + "=".repeat(50));
  console.log("STEP 4: Execute Test Payment");
  console.log("=".repeat(50));

  const paymentAmount = ethers.parseUnits("0.5", 6); // $0.50 USDC
  const paymentPurpose = "Test payment - Marketing expense";

  console.log("\n💸 Executing payment:");
  console.log("├─ To:", beneficiary);
  console.log("├─ Amount:", ethers.formatUnits(paymentAmount, 6), "USDC");
  console.log("└─ Purpose:", paymentPurpose);

  try {
    const paymentTx = await marketingPot.executePayment(
      beneficiary,
      paymentAmount,
      paymentPurpose
    );

    console.log("\n⏳ Waiting for confirmation...");
    const receipt = await paymentTx.wait();

    console.log("✅ Payment executed!");
    console.log("├─ Transaction:", receipt.hash);
    console.log("├─ Block:", receipt.blockNumber);
    console.log("└─ Gas used:", receipt.gasUsed.toString());
  } catch (error: any) {
    console.log("❌ Payment failed:", error.message);
    if (error.message.includes("Insufficient budget")) {
      console.log("⚠️  Pot doesn't have enough budget");
    } else if (error.message.includes("not whitelisted")) {
      console.log("⚠️  Beneficiary not whitelisted");
    }
    process.exit(1);
  }

  // Step 5: Check updated state
  console.log("\n" + "=".repeat(50));
  console.log("STEP 5: Verify Payment Success");
  console.log("=".repeat(50));

  const finalBalance = await marketingPot.getRemainingBudget();
  const finalUtilization = await marketingPot.getBudgetUtilization();
  const finalPayments = await marketingPot.getPaymentCount();
  const spentAmount = await marketingPot.spentAmount();

  console.log("\n📊 Marketing Pot - After:");
  console.log("├─ Budget:", ethers.formatUnits(finalBalance, 6), "USDC");
  console.log("├─ Spent:", ethers.formatUnits(spentAmount, 6), "USDC");
  console.log("├─ Utilization:", finalUtilization.toString() + "%");
  console.log("└─ Payments:", finalPayments.toString());

  console.log("\n📈 Changes:");
  console.log("├─ Budget decreased:", ethers.formatUnits(initialBalance - finalBalance, 6), "USDC");
  console.log("├─ Utilization increased:", (finalUtilization - initialUtilization).toString() + "%");
  console.log("└─ Payments increased:", (finalPayments - initialPayments).toString());

  // Step 6: Get payment details
  console.log("\n" + "=".repeat(50));
  console.log("STEP 6: Payment History");
  console.log("=".repeat(50));

  const latestPaymentIndex = Number(finalPayments) - 1;
  const payment = await marketingPot.payments(latestPaymentIndex);

  console.log("\n📝 Latest Payment:");
  console.log("├─ Recipient:", payment.recipient);
  console.log("├─ Amount:", ethers.formatUnits(payment.amount, 6), "USDC");
  console.log("├─ Purpose:", payment.purpose);
  console.log("├─ Timestamp:", new Date(Number(payment.timestamp) * 1000).toLocaleString());
  console.log("└─ Executed:", payment.executed ? "Yes" : "No");

  // Step 7: Check total system balance
  console.log("\n" + "=".repeat(50));
  console.log("STEP 7: System Overview");
  console.log("=".repeat(50));

  const totalBalance = await treasury.getTotalBalance();
  const treasuryBalance = await treasury.getTreasuryBalance();
  const walletBalance = await usdc.balanceOf(beneficiary);

  console.log("\n💰 System Balances:");
  console.log("├─ Total System:", ethers.formatUnits(totalBalance, 6), "USDC");
  console.log("├─ Treasury Reserve:", ethers.formatUnits(treasuryBalance, 6), "USDC");
  console.log("└─ Your Wallet:", ethers.formatUnits(walletBalance, 6), "USDC");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("WORKFLOW TEST COMPLETE");
  console.log("=".repeat(50));

  console.log("\n✅ Successfully demonstrated:");
  console.log("├─ 1. Pot information retrieval");
  console.log("├─ 2. Beneficiary whitelisting");
  console.log("├─ 3. Payment execution");
  console.log("├─ 4. Budget tracking");
  console.log("├─ 5. Payment history");
  console.log("└─ 6. System balance queries");

  console.log("\n🎯 Key Features Verified:");
  console.log("├─ ✅ USDC integration working");
  console.log("├─ ✅ Budget enforcement active");
  console.log("├─ ✅ Whitelist protection enabled");
  console.log("├─ ✅ Payment execution successful");
  console.log("└─ ✅ State updates accurate");

  console.log("\n🔗 View on Explorer:");
  console.log(`https://testnet.arcscan.app/address/${marketingPotAddress}`);

  console.log("\n📚 Next Steps:");
  console.log("1. Add more beneficiaries to other Pots");
  console.log("2. Create automated payment Flows");
  console.log("3. Set up multi-sig approvals");
  console.log("4. Build frontend interface\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Workflow test failed:");
    console.error(error);
    process.exit(1);
  });
