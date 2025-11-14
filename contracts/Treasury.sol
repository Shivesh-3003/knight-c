// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Pot.sol";
import "./Flow.sol";

/**
 * @title Treasury
 * @notice Main treasury smart contract wallet for Knight-C
 * @dev Holds all company USDC and manages departmental Pots
 *
 * Key Features:
 * - Serves as central source of truth for global liquidity
 * - Creates and manages departmental Pots with configurable privacy
 * - Handles top-level fund allocations
 * - Enforces multi-signature approval requirements
 * - Integrates with Circle Gateway for USD <-> USDC conversion
 */
contract Treasury {
    // Treasury state
    address public cfo;
    mapping(address => bool) public approvers;
    mapping(bytes32 => Pot) public pots;
    bytes32[] public potIds;

    // USDC token address on Arc
    address public immutable USDC;

    // Events
    event TreasuryFunded(address indexed from, uint256 amount);
    event PotCreated(bytes32 indexed potId, string name, bool isPrivate, uint256 budget);
    event FundsAllocated(bytes32 indexed potId, uint256 amount);
    event ApproverAdded(address indexed approver);
    event ApproverRemoved(address indexed approver);

    // Modifiers
    modifier onlyCFO() {
        require(msg.sender == cfo, "Only CFO can execute this");
        _;
    }

    modifier onlyApprover() {
        require(approvers[msg.sender] || msg.sender == cfo, "Not authorized");
        _;
    }

    constructor(address _usdc, address _cfo) {
        USDC = _usdc;
        cfo = _cfo;
        approvers[_cfo] = true;
    }

    /**
     * @notice Fund the treasury via Circle Gateway
     * @param amount Amount of USDC to deposit
     */
    function fundTreasury(uint256 amount) external {
        // TODO: Integrate with Circle Gateway SDK
        // TODO: Transfer USDC from sender to treasury
        emit TreasuryFunded(msg.sender, amount);
    }

    /**
     * @notice Create a new departmental Pot
     * @param name Department name (e.g., "Engineering", "Marketing")
     * @param budget Initial budget allocation in USDC
     * @param isPrivate Whether to use Arc's privacy features
     * @param approvalThreshold Amount requiring multi-sig approval
     */
    function createPot(
        string memory name,
        uint256 budget,
        bool isPrivate,
        uint256 approvalThreshold
    ) external onlyCFO returns (bytes32) {
        // TODO: Deploy new Pot contract
        // TODO: Transfer initial budget to Pot
        // TODO: Configure privacy settings via Arc

        bytes32 potId = keccak256(abi.encodePacked(name, block.timestamp));
        potIds.push(potId);

        emit PotCreated(potId, name, isPrivate, budget);
        return potId;
    }

    /**
     * @notice Allocate additional funds to a Pot
     * @param potId Pot identifier
     * @param amount Amount to allocate
     */
    function allocateToPot(bytes32 potId, uint256 amount) external onlyCFO {
        // TODO: Transfer USDC to Pot
        // TODO: Update Pot budget
        emit FundsAllocated(potId, amount);
    }

    /**
     * @notice Add an approver for multi-signature workflows
     * @param approver Address to add as approver
     */
    function addApprover(address approver) external onlyCFO {
        approvers[approver] = true;
        emit ApproverAdded(approver);
    }

    /**
     * @notice Remove an approver
     * @param approver Address to remove
     */
    function removeApprover(address approver) external onlyCFO {
        approvers[approver] = false;
        emit ApproverRemoved(approver);
    }

    /**
     * @notice Get total treasury balance
     * @return Total USDC balance across all Pots
     */
    function getTotalBalance() external view returns (uint256) {
        // TODO: Sum balances across all Pots
        return 0;
    }

    /**
     * @notice Get list of all Pot IDs
     * @return Array of Pot identifiers
     */
    function getAllPots() external view returns (bytes32[] memory) {
        return potIds;
    }
}
