// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICircleGateway
 * @notice Interface for Circle Gateway on/off ramp integration
 * @dev Handles USD <-> USDC conversion for treasury operations
 */
interface ICircleGateway {
    /**
     * @notice Deposit USD and receive USDC
     * @param amount USD amount to deposit
     * @param recipient Address to receive USDC
     * @return USDC amount minted
     */
    function deposit(uint256 amount, address recipient) external returns (uint256);

    /**
     * @notice Withdraw USDC and receive USD
     * @param amount USDC amount to withdraw
     * @param bankAccount Destination bank account details
     * @return Withdrawal reference ID
     */
    function withdraw(uint256 amount, bytes memory bankAccount) external returns (bytes32);

    /**
     * @notice Get deposit fee
     * @param amount Deposit amount
     * @return Fee in basis points
     */
    function getDepositFee(uint256 amount) external view returns (uint256);

    /**
     * @notice Get withdrawal fee
     * @param amount Withdrawal amount
     * @return Fee in basis points
     */
    function getWithdrawalFee(uint256 amount) external view returns (uint256);

    // Events
    event Deposit(address indexed recipient, uint256 usdAmount, uint256 usdcAmount);
    event Withdrawal(address indexed sender, uint256 usdcAmount, bytes32 indexed refId);
}
