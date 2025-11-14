import { expect } from "chai";
import { ethers } from "hardhat";
import { Treasury } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Treasury", function () {
  let treasury: Treasury;
  let cfo: SignerWithAddress;
  let user: SignerWithAddress;
  let mockUSDC: string;

  beforeEach(async function () {
    [cfo, user] = await ethers.getSigners();

    // Mock USDC address (in real tests, deploy a mock ERC20)
    mockUSDC = "0x0000000000000000000000000000000000000001";

    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(mockUSDC, cfo.address);
    await treasury.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct CFO", async function () {
      expect(await treasury.cfo()).to.equal(cfo.address);
    });

    it("Should set the correct USDC address", async function () {
      expect(await treasury.USDC()).to.equal(mockUSDC);
    });

    it("Should add CFO as approver", async function () {
      expect(await treasury.approvers(cfo.address)).to.be.true;
    });
  });

  describe("Pot Creation", function () {
    it("Should allow CFO to create a Pot", async function () {
      const potName = "Engineering";
      const budget = ethers.parseUnits("2000000", 6); // $2M
      const isPrivate = true;
      const approvalThreshold = ethers.parseUnits("100000", 6);

      await expect(
        treasury.createPot(potName, budget, isPrivate, approvalThreshold)
      ).to.emit(treasury, "PotCreated");
    });

    it("Should prevent non-CFO from creating Pot", async function () {
      await expect(
        treasury.connect(user).createPot("Marketing", 500000, false, 100000)
      ).to.be.revertedWith("Only CFO can execute this");
    });
  });

  describe("Approver Management", function () {
    it("Should allow CFO to add approver", async function () {
      await treasury.addApprover(user.address);
      expect(await treasury.approvers(user.address)).to.be.true;
    });

    it("Should allow CFO to remove approver", async function () {
      await treasury.addApprover(user.address);
      await treasury.removeApprover(user.address);
      expect(await treasury.approvers(user.address)).to.be.false;
    });

    it("Should prevent non-CFO from managing approvers", async function () {
      await expect(
        treasury.connect(user).addApprover(user.address)
      ).to.be.revertedWith("Only CFO can execute this");
    });
  });

  // TODO: Add tests for:
  // - Pot budget allocation
  // - Payment execution
  // - Multi-sig approvals
  // - SalaryShield temporal jitter
  // - Budget enforcement
  // - Flow automation
});
