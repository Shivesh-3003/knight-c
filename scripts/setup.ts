import { ethers as hardhatEthers } from "hardhat";

async function main() {
  const [deployer] = await hardhatEthers.getSigners();

  // Get deployed contract address (should be set in environment or hardcoded)
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (!treasuryAddress) {
    throw new Error("TREASURY_ADDRESS not set in environment");
  }

  const contract = await hardhatEthers.getContractAt("TreasuryVault", treasuryAddress);

  // Example addresses - replace with actual addresses
  const cfoAddress = process.env.CFO_ADDRESS;
  const engVPAddress = process.env.ENG_VP_ADDRESS;

  if (!cfoAddress || !engVPAddress) {
    throw new Error("CFO_ADDRESS and ENG_VP_ADDRESS must be set in environment");
  }

  const engId = hardhatEthers.encodeBytes32String("engineering");
  const mktId = hardhatEthers.encodeBytes32String("marketing");
  const opsId = hardhatEthers.encodeBytes32String("operations");

  console.log("Creating pots...");

  // Engineering: 2 approvers (CFO + VP) for multi-sig demo
  await contract.createPot(
    engId,
    hardhatEthers.parseUnits("2000000", 6),
    [cfoAddress, engVPAddress], // 2 approvers
    hardhatEthers.parseUnits("100000", 6)
  );
  console.log("Created Engineering pot: $2,000,000 budget, $100,000 threshold");

  // Marketing: 1 approver (CFO only)
  await contract.createPot(
    mktId,
    hardhatEthers.parseUnits("500000", 6),
    [cfoAddress],
    hardhatEthers.parseUnits("50000", 6)
  );
  console.log("Created Marketing pot: $500,000 budget, $50,000 threshold");

  // Operations: 1 approver (CFO only)
  await contract.createPot(
    opsId,
    hardhatEthers.parseUnits("750000", 6),
    [cfoAddress],
    hardhatEthers.parseUnits("50000", 6)
  );
  console.log("Created Operations pot: $750,000 budget, $50,000 threshold");

  console.log("Setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
