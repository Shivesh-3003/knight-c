import { ethers } from "hardhat";

/**
 * Knight-C Deployment Script for Arc Network
 *
 * Deploys:
 * 1. Treasury contract
 * 2. Flow contract
 * 3. Initial Pots (Engineering, Marketing, Operations)
 *
 * Prerequisites:
 * - Wallet funded with USDC for gas (get from https://faucet.circle.com)
 * - PRIVATE_KEY in .env
 * - Connected to Arc Testnet
 *
 * Arc Testnet Configuration:
 * - RPC: https://rpc.testnet.arc.network
 * - Chain ID: 1994692133
 * - USDC Address: 0x3600000000000000000000000000000000000000
 * - Gas Token: USDC (not ETH!)
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   Knight-C Treasury Deployment on Arc Network ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  console.log("Deployer address:", deployer.address);

  // On Arc, balance is in USDC (6 decimals), not ETH
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("USDC balance (for gas):", ethers.formatUnits(balance, 6), "USDC\n");

  if (balance === 0n) {
    console.error("❌ No USDC for gas! Get testnet USDC from: https://faucet.circle.com");
    process.exit(1);
  }

  // Arc Network Configuration
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  const GATEWAY_ADDRESS = process.env.CIRCLE_GATEWAY_ADDRESS || "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
  const CFO_ADDRESS = deployer.address; // In production, use separate CFO address

  console.log("Network Configuration:");
  console.log("├─ USDC Address:", USDC_ADDRESS);
  console.log("├─ Gateway Address:", GATEWAY_ADDRESS);
  console.log("└─ CFO Address:", CFO_ADDRESS);

  console.log("\n=== Deploying Treasury Contract ===");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(USDC_ADDRESS, CFO_ADDRESS, GATEWAY_ADDRESS);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("✅ Treasury deployed to:", treasuryAddress);

  console.log("\n=== Deploying Flow Contract ===");
  const Flow = await ethers.getContractFactory("Flow");
  const flow = await Flow.deploy(treasuryAddress);
  await flow.waitForDeployment();
  const flowAddress = await flow.getAddress();
  console.log("✅ Flow deployed to:", flowAddress);

  // Skip Pot creation during deployment
  // You must fund Treasury first, then create Pots
  console.log("\n=== Skipping Initial Pots ===");
  console.log("⚠️  Fund Treasury first, then create Pots manually");
  console.log("Example: treasury.fundTreasury(ethers.parseUnits('1000', 6))");

  // Output deployment summary
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║           Deployment Summary                   ║");
  console.log("╚════════════════════════════════════════════════╝");

  const network = await ethers.provider.getNetwork();
  console.log("\nNetwork:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("\n📄 Contract Addresses:");
  console.log("├─ Treasury:", treasuryAddress);
  console.log("├─ Flow:", flowAddress);
  console.log("└─ CFO:", CFO_ADDRESS);

  console.log("\n🌐 Arc Network Info:");
  console.log("├─ Explorer:", `https://testnet.arcscan.app/address/${treasuryAddress}`);
  console.log("└─ Faucet:", "https://faucet.circle.com");

  console.log("\n⚙️  Update your .env file with:");
  console.log(`VITE_TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`VITE_USDC_ADDRESS=${USDC_ADDRESS}`);

  console.log("\n✅ Contract Verification Commands:");
  console.log(`npx hardhat verify --network arcTestnet ${treasuryAddress} "${USDC_ADDRESS}" "${CFO_ADDRESS}" "${GATEWAY_ADDRESS}"`);
  console.log(`npx hardhat verify --network arcTestnet ${flowAddress} "${treasuryAddress}"`);

  console.log("\n📚 Next Steps:");
  console.log("1. Fund Treasury with USDC: treasury.fundTreasury(amount)");
  console.log("2. Whitelist beneficiaries in each Pot");
  console.log("3. Execute test payments");
  console.log("4. Set up automated Flows for payroll\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
