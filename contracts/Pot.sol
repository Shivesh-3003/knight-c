// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IUSDC.sol";

/**
 * @title Pot
 * @notice Departmental smart contract sub-account with configurable privacy
 * @dev Manages budget, spending rules, and payment execution for a department
 *
 * Key Features:
 * - Enforced budget limits (on-chain state variable)
 * - Configurable privacy (Public or Private via Arc)
 * - Beneficiary whitelist for fraud prevention
 * - Multi-signature approval thresholds
 * - Automated recurring payments via Flows
 */
contract Pot {
    // Pot metadata
    string public name;
    bool public isPrivate;
    address public treasury;
    address public manager; // Department head

    // USDC token on Arc Network
    // Arc Testnet USDC: 0x3600000000000000000000000000000000000000
    IUSDC public immutable usdc;

    // Budget management
    uint256 public allocatedBudget;
    uint256 public spentAmount;
    uint256 public approvalThreshold;

    // Fraud prevention
    mapping(address => bool) public whitelist;
    address[] public whitelistedAddresses;

    // Multi-signature
    mapping(bytes32 => mapping(address => bool)) public approvals;
    mapping(bytes32 => uint256) public approvalCount;
    uint256 public requiredApprovals = 2;

    // Payment history
    struct Payment {
        address recipient;
        uint256 amount;
        uint256 timestamp;
        string purpose;
        bool executed;
    }
    Payment[] public payments;

    // Events
    event BudgetAllocated(uint256 amount, uint256 newTotal);
    event PaymentExecuted(address indexed recipient, uint256 amount, string purpose);
    event PaymentApproved(bytes32 indexed paymentId, address indexed approver);
    event BeneficiaryWhitelisted(address indexed beneficiary);
    event BudgetExceeded(uint256 requested, uint256 available);

    // Modifiers
    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only treasury can execute this");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only manager can execute this");
        _;
    }

    modifier hasBudget(uint256 amount) {
        require(allocatedBudget - spentAmount >= amount, "Insufficient budget");
        _;
    }

    modifier isWhitelisted(address recipient) {
        require(whitelist[recipient], "Recipient not whitelisted");
        _;
    }

    constructor(
        string memory _name,
        bool _isPrivate,
        address _treasury,
        address _manager,
        uint256 _initialBudget,
        uint256 _approvalThreshold
    ) {
        require(_treasury != address(0), "Invalid treasury address");
        require(_manager != address(0), "Invalid manager address");

        name = _name;
        isPrivate = _isPrivate;
        treasury = _treasury;
        manager = _manager;
        allocatedBudget = _initialBudget;
        approvalThreshold = _approvalThreshold;

        // Get USDC address from Treasury
        // Arc Testnet USDC: 0x3600000000000000000000000000000000000000
        usdc = IUSDC(0x3600000000000000000000000000000000000000);
    }

    /**
     * @notice Execute a payment from this Pot
     * @param recipient Beneficiary address (must be whitelisted)
     * @param amount Payment amount in USDC
     * @param purpose Payment description
     */
    function executePayment(
        address recipient,
        uint256 amount,
        string memory purpose
    ) external onlyManager hasBudget(amount) isWhitelisted(recipient) {
        // Check if multi-sig approval needed
        if (amount >= approvalThreshold) {
            bytes32 paymentId = keccak256(abi.encodePacked(recipient, amount, purpose, block.timestamp));
            require(approvalCount[paymentId] >= requiredApprovals, "Insufficient approvals");
        }

        // Execute payment
        _executePayment(recipient, amount, purpose);
    }

    /**
     * @notice Execute payment with SalaryShield temporal jitter (for payroll)
     * @param recipients Array of employee wallet addresses
     * @param amounts Array of corresponding payment amounts
     * @param jitterDelays Array of randomized delays in milliseconds
     */
    function executePayrollWithJitter(
        address[] memory recipients,
        uint256[] memory amounts,
        uint256[] memory jitterDelays
    ) external onlyManager {
        require(recipients.length == amounts.length, "Array length mismatch");
        require(recipients.length == jitterDelays.length, "Array length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(allocatedBudget - spentAmount >= totalAmount, "Insufficient budget for payroll");

        // TODO: Implement temporal jitter execution
        // Each payment executes with randomized 50-200ms delay
        // Payments distributed over ~10 seconds for privacy

        for (uint256 i = 0; i < recipients.length; i++) {
            require(whitelist[recipients[i]], "Employee not whitelisted");
            // TODO: Apply jitterDelays[i] before execution
            _executePayment(recipients[i], amounts[i], "Payroll");
        }
    }

    /**
     * @notice Approve a payment (for multi-sig)
     * @param paymentId Hash of payment details
     */
    function approvePayment(bytes32 paymentId) external {
        require(!approvals[paymentId][msg.sender], "Already approved");
        approvals[paymentId][msg.sender] = true;
        approvalCount[paymentId]++;
        emit PaymentApproved(paymentId, msg.sender);
    }

    /**
     * @notice Add beneficiary to whitelist
     * @param beneficiary Address to whitelist
     */
    function whitelistBeneficiary(address beneficiary) external onlyManager {
        whitelist[beneficiary] = true;
        whitelistedAddresses.push(beneficiary);
        emit BeneficiaryWhitelisted(beneficiary);
    }

    /**
     * @notice Allocate additional budget to this Pot
     * @param amount Additional budget in USDC
     */
    function allocateBudget(uint256 amount) external onlyTreasury {
        allocatedBudget += amount;
        emit BudgetAllocated(amount, allocatedBudget);
    }

    /**
     * @notice Get remaining budget
     * @return Available budget in USDC
     */
    function getRemainingBudget() external view returns (uint256) {
        return allocatedBudget - spentAmount;
    }

    /**
     * @notice Get budget utilization percentage
     * @return Percentage of budget spent (0-100)
     */
    function getBudgetUtilization() external view returns (uint256) {
        if (allocatedBudget == 0) return 0;
        return (spentAmount * 100) / allocatedBudget;
    }

    /**
     * @notice Internal payment execution
     */
    function _executePayment(
        address recipient,
        uint256 amount,
        string memory purpose
    ) internal {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");

        // Update budget
        spentAmount += amount;

        // Record payment
        payments.push(Payment({
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            purpose: purpose,
            executed: true
        }));

        // Transfer USDC to recipient
        bool success = usdc.transfer(recipient, amount);
        require(success, "USDC payment failed");

        // Note: Arc's privacy features (confidential transfers) are planned but not yet available
        // When available, isPrivate flag will trigger shielded transactions with encrypted amounts

        emit PaymentExecuted(recipient, amount, purpose);
    }

    /**
     * @notice Get payment history count
     * @return Number of payments executed
     */
    function getPaymentCount() external view returns (uint256) {
        return payments.length;
    }
}
