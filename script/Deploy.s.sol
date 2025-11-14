// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {TreasuryVault} from "src/TreasuryVault.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address cfoAddress = vm.envAddress("CFO_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        new TreasuryVault(cfoAddress);

        vm.stopBroadcast();
    }
}
