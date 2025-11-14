// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Pot.sol";
import "./Flow.sol";
import "./interfaces/IUSDC.sol";
import "./interfaces/ICircleGateway.sol";

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
    mapping(bytes32 => address) public pots; // ✅ Fixed: Store Pot addresses, not instances
    bytes32[] public potIds;

    // USDC token on Arc Network
    // Arc Testnet USDC: 0x3600000000000000000000000000000000000000
    IUSDC public immutable usdc;

    // Optional: Circle Gateway for USD <-> USDC conversion
    ICircleGateway public gateway;

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

    constructor(address _usdc, address _cfo, address _gateway) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_cfo != address(0), "Invalid CFO address");

        usdc = IUSDC(_usdc);
        cfo = _cfo;
        approvers[_cfo] = true;

        // Gateway is optional, can be address(0)
        if (_gateway != address(0)) {
            gateway = ICircleGateway(_gateway);
        }
    }

    /**
     * @notice Fund the treasury with USDC
     * @param amount Amount of USDC to deposit (6 decimals, e.g., 1000000 = 1 USDC)
     * @dev Caller must approve this contract to spend USDC first
     */
    function fundTreasury(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer USDC from sender to treasury
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");

        emit TreasuryFunded(msg.sender, amount);
    }

    /**
     * @notice Fund treasury via Circle Gateway (optional)
     * @param amount Amount to deposit via Gateway
     * @dev Requires Gateway to be configured
     */
    function fundViaGateway(uint256 amount) external onlyCFO {
        require(address(gateway) != address(0), "Gateway not configured");
        require(amount > 0, "Amount must be greater than 0");

        // Approve and deposit to Gateway
        usdc.approve(address(gateway), amount);
        bool success = gateway.deposit(amount);
        require(success, "Gateway deposit failed");

        emit TreasuryFunded(msg.sender, amount);
    }

    /**
     * @notice Create a new departmental Pot
     * @param name Department name (e.g., "Engineering", "Marketing")
     * @param manager Department head who will manage this Pot
     * @param budget Initial budget allocation in USDC (6 decimals)
     * @param isPrivate Whether to use Arc's privacy features (planned)
     * @param approvalThreshold Amount requiring multi-sig approval (6 decimals)
     */
    function createPot(
        string memory name,
        address manager,
        uint256 budget,
        bool isPrivate,
        uint256 approvalThreshold
    ) external onlyCFO returns (bytes32) {
        require(manager != address(0), "Invalid manager address");
        require(budget > 0, "Budget must be greater than 0");

        // Generate unique Pot ID
        bytes32 potId = keccak256(abi.encodePacked(name, block.timestamp, manager));
        require(pots[potId] == address(0), "Pot already exists");

        // Deploy new Pot contract
        Pot newPot = new Pot(
            name,
            isPrivate,
            address(this),      // Treasury is the owner
            manager,            // Department head
            budget,             // Initial budget
            approvalThreshold   // Multi-sig threshold
        );

        // Store Pot address
        pots[potId] = address(newPot);
        potIds.push(potId);

        // Transfer initial budget to Pot
        if (budget > 0) {
            bool success = usdc.transfer(address(newPot), budget);
            require(success, "Initial budget transfer failed");
        }

        emit PotCreated(potId, name, isPrivate, budget);
        return potId;
    }

    /**
     * @notice Allocate additional funds to a Pot
     * @param potId Pot identifier
     * @param amount Amount to allocate (6 decimals)
     */
    function allocateToPot(bytes32 potId, uint256 amount) external onlyCFO {
        require(amount > 0, "Amount must be greater than 0");
        address potAddress = pots[potId];
        require(potAddress != address(0), "Pot does not exist");

        // Transfer USDC to Pot
        bool success = usdc.transfer(potAddress, amount);
        require(success, "USDC transfer to Pot failed");

        // Update Pot's allocated budget
        Pot(potAddress).allocateBudget(amount);

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
     * @return Total USDC balance in Treasury contract plus all Pots
     */
    function getTotalBalance() external view returns (uint256) {
        uint256 total = usdc.balanceOf(address(this));

        // Add balances from all Pots
        for (uint256 i = 0; i < potIds.length; i++) {
            address potAddress = pots[potIds[i]];
            if (potAddress != address(0)) {
                total += usdc.balanceOf(potAddress);
            }
        }

        return total;
    }

    /**
     * @notice Get Treasury's own USDC balance (excluding Pots)
     * @return USDC balance held directly by Treasury
     */
    function getTreasuryBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Get Pot address by ID
     * @param potId Pot identifier
     * @return Pot contract address
     */
    function getPotAddress(bytes32 potId) external view returns (address) {
        return pots[potId];
    }

    /**
     * @notice Get list of all Pot IDs
     * @return Array of Pot identifiers
     */
    function getAllPots() external view returns (bytes32[] memory) {
        return potIds;
    }
}
