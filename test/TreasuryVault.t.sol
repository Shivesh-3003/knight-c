// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test} from "forge-std/Test.sol";
import {TreasuryVault} from "src/TreasuryVault.sol";

contract TreasuryVaultTest is Test {
    TreasuryVault public treasury;
    address public cfo = address(0x1);
    address public user = address(0x2);

    function setUp() public {
        treasury = new TreasuryVault(cfo);
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
}
