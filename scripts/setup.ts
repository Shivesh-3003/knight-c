import { parseUnits } from "viem";
import { stringToBytes32 } from "../frontend/src/lib/utils";
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  // Get deployed contract address (should be set in environment or hardcoded)
  const treasuryAddress = process.env.TREASURY_ADDRESS as `0x${string}`;
  if (!treasuryAddress) {
    throw new Error("TREASURY_ADDRESS not set in environment");
  }

  const contract = await hre.viem.getContractAt("TreasuryVault", treasuryAddress);

  // Example addresses - replace with actual addresses
  const cfoAddress = process.env.CFO_ADDRESS as `0x${string}`;
  const engVPAddress = process.env.ENG_VP_ADDRESS as `0x${string}`;

  if (!cfoAddress || !engVPAddress) {
    throw new Error("CFO_ADDRESS and ENG_VP_ADDRESS must be set in environment");
  }

  const engId = stringToBytes32("engineering");
  const mktId = stringToBytes32("marketing");
  const opsId = stringToBytes32("operations");

  console.log("Creating pots...");

  // Engineering: 2 approvers (CFO + VP) for multi-sig demo
  await contract.write.createPot([
    engId,
    parseUnits("2000000", 6),
    [cfoAddress, engVPAddress], // 2 approvers
    parseUnits("100000", 6)
  ]);
  console.log("Created Engineering pot: $2,000,000 budget, $100,000 threshold");

  // Marketing: 1 approver (CFO only)
  await contract.write.createPot([
    mktId,
    parseUnits("500000", 6),
    [cfoAddress],
    parseUnits("50000", 6)
  ]);
  console.log("Created Marketing pot: $500,000 budget, $50,000 threshold");

  // Operations: 1 approver (CFO only)
  await contract.write.createPot([
    opsId,
    parseUnits("750000", 6),
    [cfoAddress],
    parseUnits("50000", 6)
  ]);
  console.log("Created Operations pot: $750,000 budget, $50,000 threshold");

  console.log("Setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
