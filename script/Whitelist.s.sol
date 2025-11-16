// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script, console} from "forge-std/Script.sol";
import {TreasuryVault} from "src/TreasuryVault.sol";

/**
 * @title Whitelist
 * @notice Script to add beneficiaries to departmental pots
 * @dev Run this to whitelist addresses that can receive payments from pots
 *
 * Usage:
 * forge script script/Whitelist.s.sol:Whitelist --rpc-url $ARC_TESTNET_RPC_URL --broadcast --legacy
 */
contract Whitelist is Script {
    // Treasury contract address
    address constant TREASURY_ADDRESS = 0x4094b8392d2Ca5A72185C341b6bbDcBA2f8404a4;

    // Addresses to whitelist
    address constant CFO_ADDRESS = 0x8a7E77cB7d380AE79C2aC8c9928Ecfe06eE840AB;
    address constant VP_ADDRESS = 0xe88F1F5B506d4E0122869C888FcB481FCF2476ce;
    address constant EMPLOYEE_ADDRESS = 0x5e2787391ecA7099E3eB30DEc7679f1C39D24aC8;

    // Pot IDs (must match frontend)
    bytes32 constant ENGINEERING_POT = bytes32(bytes("engineering"));
    bytes32 constant MARKETING_POT = bytes32(bytes("marketing"));
    bytes32 constant OPERATIONS_POT = bytes32(bytes("operations"));

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        TreasuryVault vault = TreasuryVault(TREASURY_ADDRESS);

        vm.startBroadcast(deployerPrivateKey);

        // Whitelist beneficiaries for Engineering pot
        vault.addBeneficiary(ENGINEERING_POT, CFO_ADDRESS);
        vault.addBeneficiary(ENGINEERING_POT, VP_ADDRESS);
        vault.addBeneficiary(ENGINEERING_POT, EMPLOYEE_ADDRESS);

        // Whitelist beneficiaries for Marketing pot
        vault.addBeneficiary(MARKETING_POT, CFO_ADDRESS);
        vault.addBeneficiary(MARKETING_POT, VP_ADDRESS);
        vault.addBeneficiary(MARKETING_POT, EMPLOYEE_ADDRESS);

        // Whitelist beneficiaries for Operations pot
        vault.addBeneficiary(OPERATIONS_POT, CFO_ADDRESS);
        vault.addBeneficiary(OPERATIONS_POT, VP_ADDRESS);
        vault.addBeneficiary(OPERATIONS_POT, EMPLOYEE_ADDRESS);

        vm.stopBroadcast();

        console.log("=== Beneficiaries Whitelisted Successfully ===");
        console.log("Whitelisted addresses for all pots:");
        console.log("- CFO:", CFO_ADDRESS);
        console.log("- VP:", VP_ADDRESS);
        console.log("- Employee:", EMPLOYEE_ADDRESS);
    }
}
