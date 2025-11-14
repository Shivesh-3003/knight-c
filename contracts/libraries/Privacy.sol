// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Privacy
 * @notice Utility library for Arc Network privacy features and SalaryShield temporal jitter
 * @dev Provides helper functions for Arc's opt-in privacy and timing obfuscation
 *
 * Arc Privacy Features:
 * - Opt-in confidential transfers (amounts encrypted, addresses visible)
 * - View keys for auditability and compliance
 * - Privacy Module planned for future releases
 * - Supports TEE, MPC, FHE, and ZK backends
 *
 * Note: Privacy features are on Arc's roadmap and not yet available on testnet.
 * This library provides compatibility layer for future privacy integration.
 */
library Privacy {
    /**
     * @notice Generate temporal jitter delays for SalaryShield mode
     * @param count Number of delays to generate
     * @param minDelay Minimum delay in milliseconds (default: 50ms)
     * @param maxDelay Maximum delay in milliseconds (default: 200ms)
     * @return Array of randomized delays
     */
    function generateJitterDelays(
        uint256 count,
        uint256 minDelay,
        uint256 maxDelay
    ) internal view returns (uint256[] memory) {
        require(maxDelay > minDelay, "Invalid delay range");

        uint256[] memory delays = new uint256[](count);
        uint256 range = maxDelay - minDelay;

        for (uint256 i = 0; i < count; i++) {
            // Pseudo-random delay using block properties and index
            uint256 randomValue = uint256(
                keccak256(abi.encodePacked(block.timestamp, block.prevrandao, i))
            );
            delays[i] = minDelay + (randomValue % range);
        }

        return delays;
    }

    /**
     * @notice Calculate optimal batch size for jittered execution
     * @param totalRecipients Total number of recipients
     * @param maxExecutionTime Maximum execution time in seconds
     * @return Optimal batch size
     */
    function calculateBatchSize(
        uint256 totalRecipients,
        uint256 maxExecutionTime
    ) internal pure returns (uint256) {
        // Assuming average 100ms per transaction
        uint256 avgTimePerTx = 100; // milliseconds
        uint256 maxTxPerBatch = (maxExecutionTime * 1000) / avgTimePerTx;

        if (totalRecipients <= maxTxPerBatch) {
            return totalRecipients;
        }

        return maxTxPerBatch;
    }

    /**
     * @notice Validate privacy configuration
     * @param isPrivate Whether privacy is enabled
     * @param hasViewKey Whether view key is configured
     * @return Whether configuration is valid
     */
    function validatePrivacyConfig(
        bool isPrivate,
        bool hasViewKey
    ) internal pure returns (bool) {
        // Private pots should have view key configured for CFO access
        if (isPrivate && !hasViewKey) {
            return false;
        }
        return true;
    }

    /**
     * @notice Generate view key hash for authorized access
     * @param cfo CFO address
     * @param potId Pot identifier
     * @return View key hash
     */
    function generateViewKeyHash(
        address cfo,
        bytes32 potId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(cfo, potId, "VIEW_KEY"));
    }
}
