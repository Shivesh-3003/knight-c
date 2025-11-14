import { ethers } from "hardhat";

/**
 * Knight-C Deployment Script
 *
 * Deploys:
 * 1. Treasury contract
 * 2. Flow contract
 * 3. Initial Pots (Engineering, Marketing, Operations)
 *
 * Prerequisites:
 * - USDC token address on Arc (from Circle)
 * - Circle Gateway integration configured
 * - CFO wallet address
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Knight-C contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x0000000000000000000000000000000000000000";
  const CFO_ADDRESS = deployer.address; // In production, use separate CFO address

  console.log("\n=== Deploying Treasury Contract ===");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(USDC_ADDRESS, CFO_ADDRESS);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);

  console.log("\n=== Deploying Flow Contract ===");
  const Flow = await ethers.getContractFactory("Flow");
  const flow = await Flow.deploy(treasuryAddress);
  await flow.waitForDeployment();
  const flowAddress = await flow.getAddress();
  console.log("Flow deployed to:", flowAddress);

  // Create initial Pots
  console.log("\n=== Creating Initial Pots ===");

  console.log("Creating Engineering Pot (Private)...");
  const engineeringTx = await treasury.createPot(
    "Engineering",
    ethers.parseUnits("2000000", 6), // $2M USDC
    true, // Private (Arc privacy)
    ethers.parseUnits("100000", 6) // $100K approval threshold
  );
  await engineeringTx.wait();
  console.log("Engineering Pot created");

  console.log("Creating Marketing Pot (Public)...");
  const marketingTx = await treasury.createPot(
    "Marketing",
    ethers.parseUnits("500000", 6), // $500K USDC
    false, // Public
    ethers.parseUnits("100000", 6)
  );
  await marketingTx.wait();
  console.log("Marketing Pot created");

  console.log("Creating Operations Pot (Public)...");
  const operationsTx = await treasury.createPot(
    "Operations",
    ethers.parseUnits("750000", 6), // $750K USDC
    false, // Public
    ethers.parseUnits("100000", 6)
  );
  await operationsTx.wait();
  console.log("Operations Pot created");

  // Output deployment summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Treasury Address:", treasuryAddress);
  console.log("Flow Address:", flowAddress);
  console.log("CFO Address:", CFO_ADDRESS);
  console.log("\nUpdate frontend .env with:");
  console.log(`VITE_TREASURY_ADDRESS=${treasuryAddress}`);

  console.log("\n=== Verification Commands ===");
  console.log(`npx hardhat verify --network arcTestnet ${treasuryAddress} "${USDC_ADDRESS}" "${CFO_ADDRESS}"`);
  console.log(`npx hardhat verify --network arcTestnet ${flowAddress} "${treasuryAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
