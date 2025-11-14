// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUSDC
 * @notice Interface for Circle's USDC token on Arc Network
 * @dev Arc Testnet USDC: 0x3600000000000000000000000000000000000000
 *
 * IMPORTANT: USDC uses 6 decimals (not 18)
 * - 1 USDC = 1,000,000 (1e6)
 * - Always use decimals() to handle amounts correctly
 * - On Arc, native USDC is used for gas payments
 */
interface IUSDC {
    // ERC20 Standard
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
