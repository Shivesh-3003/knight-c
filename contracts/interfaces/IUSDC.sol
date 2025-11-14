// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IUSDC
 * @notice Interface for USDC token on Arc blockchain
 * @dev Standard ERC20 interface with Circle-specific extensions
 */
interface IUSDC {
    // ERC20 Standard
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Circle-specific
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}
