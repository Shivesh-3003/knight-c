// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test} from "forge-std/Test.sol";
import {TreasuryVault} from "src/TreasuryVault.sol";

// Mock USDC Token for testing
contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract TreasuryVaultTest is Test {
    TreasuryVault public treasury;
    MockUSDC public usdc;
    address public cfo = address(0x1);
    address public user = address(0x2);
    address public approver1 = address(0x3);
    address public approver2 = address(0x4);
    address public beneficiary1 = address(0x5);
    address public beneficiary2 = address(0x6);

    address constant USDC_ADDRESS = 0x3600000000000000000000000000000000000000;

    function setUp() public {
        // Deploy mock USDC and etch it to the expected address
        usdc = new MockUSDC();
        vm.etch(USDC_ADDRESS, address(usdc).code);

        // Deploy treasury
        treasury = new TreasuryVault(cfo);

        // Mint USDC to test accounts
        MockUSDC(USDC_ADDRESS).mint(cfo, 10_000_000 * 1e6);
        MockUSDC(USDC_ADDRESS).mint(user, 1_000_000 * 1e6);
    }

    function test_Deployment() public view {
        assertEq(treasury.cfo(), cfo);
        assertTrue(treasury.approvers(cfo));
    }

    function test_CreatePot() public {
        bytes32 potName = "Engineering";
        uint256 budget = 2_000_000 * 1e6;
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;
        uint256 threshold = 100_000 * 1e6;

        vm.prank(cfo);
        treasury.createPot(potName, budget, approvers, threshold);

        (uint256 potBudget, uint256 potSpent, uint256 potThreshold) = treasury.getPotDetails(potName);
        assertEq(potBudget, budget);
        assertEq(potSpent, 0);
        assertEq(potThreshold, threshold);
    }

    function test_FailCreatePotNotCfo() public {
        bytes32 potName = "Marketing";
        uint256 budget = 500_000 * 1e6;
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;
        uint256 threshold = 50_000 * 1e6;

        vm.prank(user);
        vm.expectRevert("Only CFO can execute this");
        treasury.createPot(potName, budget, approvers, threshold);
    }

    function test_AddApprover() public {
        vm.prank(cfo);
        treasury.addApprover(user);
        assertTrue(treasury.approvers(user));
    }

    function test_RemoveApprover() public {
        vm.prank(cfo);
        treasury.addApprover(user);
        assertTrue(treasury.approvers(user));

        vm.prank(cfo);
        treasury.removeApprover(user);
        assertFalse(treasury.approvers(user));
    }

    function test_FailAddApproverNotCfo() public {
        vm.prank(user);
        vm.expectRevert("Only CFO can execute this");
        treasury.addApprover(user);
    }

    function test_DepositToTreasury() public {
        uint256 depositAmount = 1_000_000 * 1e6;

        vm.startPrank(cfo);
        MockUSDC(USDC_ADDRESS).approve(address(treasury), depositAmount);
        treasury.depositToTreasury(depositAmount);
        vm.stopPrank();

        assertEq(MockUSDC(USDC_ADDRESS).balanceOf(address(treasury)), depositAmount);
    }

    function test_AddBeneficiary() public {
        bytes32 potName = "Engineering";

        vm.prank(cfo);
        treasury.addBeneficiary(potName, beneficiary1);

        assertTrue(treasury.whitelist(potName, beneficiary1));
    }

    function test_FailAddBeneficiaryNotCfo() public {
        bytes32 potName = "Engineering";

        vm.prank(user);
        vm.expectRevert("Only CFO can execute this");
        treasury.addBeneficiary(potName, beneficiary1);
    }

    function test_SubmitPaymentBelowThreshold() public {
        // Setup pot
        bytes32 potName = "Engineering";
        uint256 budget = 2_000_000 * 1e6;
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;
        uint256 threshold = 100_000 * 1e6;

        vm.startPrank(cfo);
        treasury.createPot(potName, budget, approvers, threshold);
        treasury.addBeneficiary(potName, beneficiary1);

        // Fund treasury
        MockUSDC(USDC_ADDRESS).approve(address(treasury), 2_000_000 * 1e6);
        treasury.depositToTreasury(2_000_000 * 1e6);
        vm.stopPrank();

        // Submit payment below threshold (should execute immediately)
        address[] memory recipients = new address[](1);
        recipients[0] = beneficiary1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 50_000 * 1e6;

        vm.prank(cfo);
        treasury.submitPayment(potName, recipients, amounts);

        // Verify payment executed
        assertEq(MockUSDC(USDC_ADDRESS).balanceOf(beneficiary1), 50_000 * 1e6);
        (,uint256 spent,) = treasury.getPotDetails(potName);
        assertEq(spent, 50_000 * 1e6);
    }

    function test_SubmitPaymentAboveThreshold() public {
        // Setup pot with multiple approvers
        bytes32 potName = "Engineering";
        uint256 budget = 2_000_000 * 1e6;
        address[] memory approvers = new address[](2);
        approvers[0] = approver1;
        approvers[1] = approver2;
        uint256 threshold = 100_000 * 1e6;

        vm.startPrank(cfo);
        treasury.createPot(potName, budget, approvers, threshold);
        treasury.addBeneficiary(potName, beneficiary1);

        // Fund treasury
        MockUSDC(USDC_ADDRESS).approve(address(treasury), 2_000_000 * 1e6);
        treasury.depositToTreasury(2_000_000 * 1e6);
        vm.stopPrank();

        // Submit payment above threshold
        address[] memory recipients = new address[](1);
        recipients[0] = beneficiary1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 150_000 * 1e6;

        vm.prank(approver1);
        bytes32 txHash = treasury.submitPayment(potName, recipients, amounts);

        // Payment should be pending
        assertEq(MockUSDC(USDC_ADDRESS).balanceOf(beneficiary1), 0);

        // Verify pending payment exists
        (bytes32 pendingPotId, uint256 approvalCount, bool executed) = treasury.pending(txHash);
        assertEq(pendingPotId, potName);
        assertEq(approvalCount, 0);
        assertFalse(executed);
    }

    function test_ApprovePayment() public {
        // Setup pot with multiple approvers
        bytes32 potName = "Engineering";
        uint256 budget = 2_000_000 * 1e6;
        address[] memory approvers = new address[](2);
        approvers[0] = approver1;
        approvers[1] = approver2;
        uint256 threshold = 100_000 * 1e6;

        vm.startPrank(cfo);
        treasury.createPot(potName, budget, approvers, threshold);
        treasury.addBeneficiary(potName, beneficiary1);

        // Fund treasury
        MockUSDC(USDC_ADDRESS).approve(address(treasury), 2_000_000 * 1e6);
        treasury.depositToTreasury(2_000_000 * 1e6);
        vm.stopPrank();

        // Submit payment above threshold
        address[] memory recipients = new address[](1);
        recipients[0] = beneficiary1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 150_000 * 1e6;

        vm.prank(approver1);
        bytes32 txHash = treasury.submitPayment(potName, recipients, amounts);

        // First approval
        vm.prank(approver1);
        treasury.approvePayment(txHash);

        // Check approval count increased but not executed yet (needs 2/2)
        (, uint256 approvalCount, bool executed) = treasury.pending(txHash);
        assertEq(approvalCount, 1);
        assertFalse(executed);
        assertEq(MockUSDC(USDC_ADDRESS).balanceOf(beneficiary1), 0);

        // Second approval - should execute
        vm.prank(approver2);
        treasury.approvePayment(txHash);

        // Verify payment executed
        (,, executed) = treasury.pending(txHash);
        assertTrue(executed);
        assertEq(MockUSDC(USDC_ADDRESS).balanceOf(beneficiary1), 150_000 * 1e6);
    }

    function test_FailApprovePaymentNotApprover() public {
        // Setup pot
        bytes32 potName = "Engineering";
        uint256 budget = 2_000_000 * 1e6;
        address[] memory approvers = new address[](1);
        approvers[0] = approver1;
        uint256 threshold = 100_000 * 1e6;

        vm.startPrank(cfo);
        treasury.createPot(potName, budget, approvers, threshold);
        treasury.addBeneficiary(potName, beneficiary1);

        MockUSDC(USDC_ADDRESS).approve(address(treasury), 2_000_000 * 1e6);
        treasury.depositToTreasury(2_000_000 * 1e6);
        vm.stopPrank();

        // Submit payment
        address[] memory recipients = new address[](1);
        recipients[0] = beneficiary1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 150_000 * 1e6;

        vm.prank(approver1);
        bytes32 txHash = treasury.submitPayment(potName, recipients, amounts);

        // Try to approve as non-approver
        vm.prank(user);
        vm.expectRevert("Not approver");
        treasury.approvePayment(txHash);
    }

    function test_FailSubmitPaymentExceedsBudget() public {
        // Setup pot
        bytes32 potName = "Engineering";
        uint256 budget = 100_000 * 1e6;
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;
        uint256 threshold = 200_000 * 1e6;

        vm.startPrank(cfo);
        treasury.createPot(potName, budget, approvers, threshold);
        treasury.addBeneficiary(potName, beneficiary1);

        MockUSDC(USDC_ADDRESS).approve(address(treasury), 2_000_000 * 1e6);
        treasury.depositToTreasury(2_000_000 * 1e6);
        vm.stopPrank();

        // Try to submit payment exceeding budget
        address[] memory recipients = new address[](1);
        recipients[0] = beneficiary1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 150_000 * 1e6;

        vm.prank(cfo);
        vm.expectRevert("Exceeds budget");
        treasury.submitPayment(potName, recipients, amounts);
    }

    function test_FailSubmitPaymentNotWhitelisted() public {
        // Setup pot
        bytes32 potName = "Engineering";
        uint256 budget = 2_000_000 * 1e6;
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;
        uint256 threshold = 200_000 * 1e6;

        vm.startPrank(cfo);
        treasury.createPot(potName, budget, approvers, threshold);
        // Note: NOT adding beneficiary1 to whitelist

        MockUSDC(USDC_ADDRESS).approve(address(treasury), 2_000_000 * 1e6);
        treasury.depositToTreasury(2_000_000 * 1e6);
        vm.stopPrank();

        // Try to submit payment to non-whitelisted address
        address[] memory recipients = new address[](1);
        recipients[0] = beneficiary1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 50_000 * 1e6;

        vm.prank(cfo);
        vm.expectRevert("Not whitelisted");
        treasury.submitPayment(potName, recipients, amounts);
    }

    function test_BatchPayment() public {
        // Setup pot
        bytes32 potName = "Engineering";
        uint256 budget = 2_000_000 * 1e6;
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;
        uint256 threshold = 200_000 * 1e6;

        vm.startPrank(cfo);
        treasury.createPot(potName, budget, approvers, threshold);
        treasury.addBeneficiary(potName, beneficiary1);
        treasury.addBeneficiary(potName, beneficiary2);

        MockUSDC(USDC_ADDRESS).approve(address(treasury), 2_000_000 * 1e6);
        treasury.depositToTreasury(2_000_000 * 1e6);
        vm.stopPrank();

        // Submit batch payment
        address[] memory recipients = new address[](2);
        recipients[0] = beneficiary1;
        recipients[1] = beneficiary2;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 50_000 * 1e6;
        amounts[1] = 30_000 * 1e6;

        vm.prank(cfo);
        treasury.submitPayment(potName, recipients, amounts);

        // Verify both payments executed
        assertEq(MockUSDC(USDC_ADDRESS).balanceOf(beneficiary1), 50_000 * 1e6);
        assertEq(MockUSDC(USDC_ADDRESS).balanceOf(beneficiary2), 30_000 * 1e6);
        (,uint256 spent,) = treasury.getPotDetails(potName);
        assertEq(spent, 80_000 * 1e6);
    }

    function test_Reallocate() public {
        // Setup two pots
        bytes32 pot1 = "Engineering";
        bytes32 pot2 = "Marketing";
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;

        vm.startPrank(cfo);
        treasury.createPot(pot1, 2_000_000 * 1e6, approvers, 100_000 * 1e6);
        treasury.createPot(pot2, 500_000 * 1e6, approvers, 50_000 * 1e6);
        vm.stopPrank();

        // Reallocate from pot1 to pot2
        uint256 reallocationAmount = 200_000 * 1e6;

        vm.prank(cfo);
        treasury.reallocate(pot1, pot2, reallocationAmount);

        // Verify budgets updated
        (uint256 pot1Budget,,) = treasury.getPotDetails(pot1);
        (uint256 pot2Budget,,) = treasury.getPotDetails(pot2);

        assertEq(pot1Budget, 1_800_000 * 1e6);
        assertEq(pot2Budget, 700_000 * 1e6);
    }

    function test_FailReallocateInsufficientBudget() public {
        // Setup pot
        bytes32 pot1 = "Engineering";
        bytes32 pot2 = "Marketing";
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;

        vm.startPrank(cfo);
        treasury.createPot(pot1, 100_000 * 1e6, approvers, 100_000 * 1e6);
        treasury.createPot(pot2, 500_000 * 1e6, approvers, 50_000 * 1e6);
        treasury.addBeneficiary(pot1, beneficiary1);

        MockUSDC(USDC_ADDRESS).approve(address(treasury), 2_000_000 * 1e6);
        treasury.depositToTreasury(2_000_000 * 1e6);
        vm.stopPrank();

        // Spend some from pot1
        address[] memory recipients = new address[](1);
        recipients[0] = beneficiary1;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 50_000 * 1e6;

        vm.prank(cfo);
        treasury.submitPayment(pot1, recipients, amounts);

        // Try to reallocate more than available (budget - spent)
        vm.prank(cfo);
        vm.expectRevert("Insufficient");
        treasury.reallocate(pot1, pot2, 60_000 * 1e6);
    }

    function test_FailReallocateNotCfo() public {
        bytes32 pot1 = "Engineering";
        bytes32 pot2 = "Marketing";
        address[] memory approvers = new address[](1);
        approvers[0] = cfo;

        vm.startPrank(cfo);
        treasury.createPot(pot1, 2_000_000 * 1e6, approvers, 100_000 * 1e6);
        treasury.createPot(pot2, 500_000 * 1e6, approvers, 50_000 * 1e6);
        vm.stopPrank();

        vm.prank(user);
        vm.expectRevert("Only CFO can execute this");
        treasury.reallocate(pot1, pot2, 100_000 * 1e6);
    }
}
