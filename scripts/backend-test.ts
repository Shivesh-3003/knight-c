
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  // Get deployed contract address (should be set in environment or hardcoded)
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (!treasuryAddress) {
    throw new Error("TREASURY_ADDRESS not set in environment");
  }

  const contract = await ethers.getContractAt("TreasuryVault", treasuryAddress);

  // 1. Deposit funds into the treasury
  const depositAmount = ethers.parseUnits("1", 6); // 1 USDC
  // We need a mock USDC contract to approve the transfer
  const usdcAddress = "0x3600000000000000000000000000000000000000";
  const usdcAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
  ];
  const usdc = await ethers.getContractAt(usdcAbi, usdcAddress);
  
  console.log("Approving USDC transfer...");
  const approveTx = await usdc.approve(treasuryAddress, depositAmount);
  await approveTx.wait();
  
  console.log("Depositing funds into treasury...");
  const depositTx = await contract.depositToTreasury(depositAmount);
  await depositTx.wait();
  
  const treasuryBalance = await usdc.balanceOf(treasuryAddress);
  console.log(`Treasury balance: ${ethers.formatUnits(treasuryBalance, 6)} USDC`);

  // 2. Submit a payment from the marketing pot
  const mktId = ethers.encodeBytes32String("marketing");
  const paymentAmount = ethers.parseUnits("1", 6); // 1 USDC
  const recipient = deployer.address;

  // Add beneficiary
  const addBeneficiaryTx = await contract.addBeneficiary(mktId, recipient);
  await addBeneficiaryTx.wait();

  console.log("Submitting payment from marketing pot...");
  const submitPaymentTx = await contract.submitPayment(mktId, [recipient], [paymentAmount]);
  await submitPaymentTx.wait();

  // 3. Check pot balance
  const pot = await contract.pots(mktId);
  console.log(`Marketing pot spent: ${ethers.formatUnits(pot.spent, 6)} USDC`);
  
  console.log("Backend test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
