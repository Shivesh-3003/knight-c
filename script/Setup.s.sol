// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script, console} from "forge-std/Script.sol";
import {TreasuryVault} from "src/TreasuryVault.sol";

/**
 * @title Setup
 * @notice Script to initialize departmental pots in the TreasuryVault
 * @dev Run after deploying TreasuryVault to create Engineering, Marketing, and Operations pots
 *
 * Usage:
 * forge script script/Setup.s.sol:Setup --rpc-url $ARC_TESTNET_RPC_URL --broadcast --legacy
 */
contract Setup is Script {
    // Treasury contract address (must be set)
    address constant TREASURY_ADDRESS = 0x4094b8392d2Ca5A72185C341b6bbDcBA2f8404a4;

    // CFO and VP addresses for approvers
    address constant CFO_ADDRESS = 0x8a7E77cB7d380AE79C2aC8c9928Ecfe06eE840AB;
    address constant VP_ADDRESS = 0xe88F1F5B506d4E0122869C888FcB481FCF2476ce;

    // Employee address for demo payments
    address constant EMPLOYEE_ADDRESS = 0x5e2787391eca7099e3eb30dec7679f1c39d24ac8;

    // Pot IDs (must match frontend stringToBytes32 function)
    // Frontend uses stringToHex(str, {size: 32}) which pads the string to 32 bytes
    // In Solidity, we convert string to bytes32 by padding with zeros
    bytes32 constant ENGINEERING_POT = bytes32(bytes("engineering"));
    bytes32 constant MARKETING_POT = bytes32(bytes("marketing"));
    bytes32 constant OPERATIONS_POT = bytes32(bytes("operations"));

    // USDC decimals = 6, so $1 = 1_000_000
    uint256 constant ONE_DOLLAR = 1_000_000;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        TreasuryVault vault = TreasuryVault(TREASURY_ADDRESS);

        vm.startBroadcast(deployerPrivateKey);

        // Create approvers array (CFO + VP for multi-sig)
        address[] memory approvers = new address[](2);
        approvers[0] = CFO_ADDRESS;
        approvers[1] = VP_ADDRESS;

        // Engineering Pot: $3 budget, $0.5 threshold (payments over $0.5 require approval)
        vault.createPot(
            ENGINEERING_POT,
            3 * ONE_DOLLAR,  // $3 budget
            approvers,
            500_000          // $0.50 threshold for approvals
        );

        // Marketing Pot: $5 budget, $0.5 threshold
        vault.createPot(
            MARKETING_POT,
            5 * ONE_DOLLAR,  // $5 budget
            approvers,
            500_000          // $0.50 threshold
        );

        // Operations Pot: $2 budget, $0.5 threshold
        vault.createPot(
            OPERATIONS_POT,
            2 * ONE_DOLLAR,  // $2 budget
            approvers,
            500_000          // $0.50 threshold
        );

        // Whitelist beneficiaries for all pots
        // This allows payments to be made to these addresses
        vault.addBeneficiary(ENGINEERING_POT, CFO_ADDRESS);
        vault.addBeneficiary(ENGINEERING_POT, VP_ADDRESS);
        vault.addBeneficiary(ENGINEERING_POT, EMPLOYEE_ADDRESS);

        vault.addBeneficiary(MARKETING_POT, CFO_ADDRESS);
        vault.addBeneficiary(MARKETING_POT, VP_ADDRESS);
        vault.addBeneficiary(MARKETING_POT, EMPLOYEE_ADDRESS);

        vault.addBeneficiary(OPERATIONS_POT, CFO_ADDRESS);
        vault.addBeneficiary(OPERATIONS_POT, VP_ADDRESS);
        vault.addBeneficiary(OPERATIONS_POT, EMPLOYEE_ADDRESS);

        vm.stopBroadcast();

        console.log("=== Pots Created Successfully ===");
        console.log("Engineering: $3 budget, $0.50 approval threshold");
        console.log("Marketing: $5 budget, $0.50 approval threshold");
        console.log("Operations: $2 budget, $0.50 approval threshold");
        console.log("");
        console.log("Approvers: CFO + VP (2-of-2 multi-sig)");
        console.log("");
        console.log("Whitelisted beneficiaries: CFO, VP, Employee");
    }
}
