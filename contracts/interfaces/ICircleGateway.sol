// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICircleGateway
 * @notice Interface for Circle Gateway - unified USDC balance across chains
 * @dev Arc Testnet Gateway Contracts:
 *      - GatewayWallet: 0x0077777d7EBA4688BDeF3E311b846F25870A19B9
 *      - GatewayAuthorization: 0x0022222ABE238Cc2C7Bb1f21003F0a260052475B
 *
 * Circle Gateway allows instant crosschain USDC transfers with next-block access.
 * Users deposit USDC to create a unified balance accessible across multiple chains.
 */
interface ICircleGateway {
    /**
     * @notice Deposit USDC to Gateway wallet
     * @param amount USDC amount to deposit (6 decimals)
     * @return success True if deposit succeeded
     */
    function deposit(uint256 amount) external returns (bool);

    /**
     * @notice Withdraw USDC from Gateway to destination chain
     * @param amount USDC amount to withdraw (6 decimals)
     * @param destinationDomain Target chain domain ID
     * @param recipient Address to receive USDC on destination chain
     * @return success True if withdrawal initiated
     */
    function withdraw(
        uint256 amount,
        uint32 destinationDomain,
        address recipient
    ) external returns (bool);

    /**
     * @notice Get Gateway balance for an account
     * @param account Address to query
     * @return balance Available USDC balance in Gateway (6 decimals)
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Check if account is authorized for Gateway
     * @param account Address to check
     * @return authorized True if account has Gateway access
     */
    function isAuthorized(address account) external view returns (bool);

    // Events
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(
        address indexed account,
        uint256 amount,
        uint32 indexed destinationDomain,
        address indexed recipient
    );
}
