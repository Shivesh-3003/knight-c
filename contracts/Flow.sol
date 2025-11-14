// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Pot.sol";
import "./interfaces/IUSDC.sol";

/**
 * @title Flow
 * @notice Automated treasury operations and recurring payment execution
 * @dev Handles scheduled distributions, recurring payments, and automated budget allocations
 *
 * Key Features:
 * - Allocation Flows: Monthly budget distributions Treasury → Pots
 * - Payment Flows: Batch payroll, vendor payments, subscriptions
 * - Approval Flows: Automated multi-signature workflows
 * - Enforcement Flows: Budget validation before transactions
 */
contract Flow {
    // Flow types
    enum FlowType {
        ALLOCATION,    // Treasury to Pot budget allocation
        PAYMENT,       // Pot to beneficiary payment
        PAYROLL,       // Batch employee payments
        SUBSCRIPTION   // Recurring vendor payments
    }

    // Flow schedule
    enum Frequency {
        DAILY,
        WEEKLY,
        BIWEEKLY,
        MONTHLY,
        QUARTERLY,
        YEARLY
    }

    // Flow configuration
    struct FlowConfig {
        FlowType flowType;
        Frequency frequency;
        address source;        // Pot or Treasury address
        address[] recipients;  // Beneficiary addresses
        uint256[] amounts;     // Payment amounts
        uint256 nextExecution; // Timestamp of next run
        bool isActive;
        bool useSalaryShield;  // Enable temporal jitter for payroll
        string description;
    }

    // State
    mapping(bytes32 => FlowConfig) public flows;
    bytes32[] public flowIds;
    address public treasury;

    // Events
    event FlowCreated(bytes32 indexed flowId, FlowType flowType, Frequency frequency);
    event FlowExecuted(bytes32 indexed flowId, uint256 timestamp, uint256 totalAmount);
    event FlowCancelled(bytes32 indexed flowId);
    event FlowUpdated(bytes32 indexed flowId);

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Only treasury can execute");
        _;
    }

    constructor(address _treasury) {
        treasury = _treasury;
    }

    /**
     * @notice Create a new automated Flow
     * @param flowType Type of flow (allocation, payment, payroll, subscription)
     * @param frequency Execution frequency
     * @param source Source Pot or Treasury address
     * @param recipients Beneficiary addresses
     * @param amounts Payment amounts
     * @param useSalaryShield Enable temporal jitter for payroll privacy
     * @param description Flow description
     */
    function createFlow(
        FlowType flowType,
        Frequency frequency,
        address source,
        address[] memory recipients,
        uint256[] memory amounts,
        bool useSalaryShield,
        string memory description
    ) public returns (bytes32) {
        require(recipients.length == amounts.length, "Array length mismatch");

        bytes32 flowId = keccak256(abi.encodePacked(
            flowType,
            source,
            recipients,
            block.timestamp
        ));

        flows[flowId] = FlowConfig({
            flowType: flowType,
            frequency: frequency,
            source: source,
            recipients: recipients,
            amounts: amounts,
            nextExecution: block.timestamp + _getFrequencyInterval(frequency),
            isActive: true,
            useSalaryShield: useSalaryShield,
            description: description
        });

        flowIds.push(flowId);
        emit FlowCreated(flowId, flowType, frequency);
        return flowId;
    }

    /**
     * @notice Execute a scheduled Flow (called by keeper network)
     * @param flowId Flow identifier
     */
    function executeFlow(bytes32 flowId) external {
        FlowConfig storage flow = flows[flowId];
        require(flow.isActive, "Flow is not active");
        require(block.timestamp >= flow.nextExecution, "Not ready for execution");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < flow.amounts.length; i++) {
            totalAmount += flow.amounts[i];
        }

        // Execute based on flow type
        if (flow.flowType == FlowType.PAYROLL && flow.useSalaryShield) {
            // Execute with temporal jitter (SalaryShield Mode)
            _executePayrollWithJitter(flow);
        } else if (flow.flowType == FlowType.PAYMENT || flow.flowType == FlowType.SUBSCRIPTION) {
            // Standard payment execution
            _executeBatchPayments(flow);
        } else if (flow.flowType == FlowType.ALLOCATION) {
            // Budget allocation flow
            _executeAllocation(flow);
        }

        // Update next execution time
        flow.nextExecution = block.timestamp + _getFrequencyInterval(flow.frequency);

        emit FlowExecuted(flowId, block.timestamp, totalAmount);
    }

    /**
     * @notice Create recurring payroll Flow with SalaryShield
     * @param potAddress Source Pot (Engineering, etc.)
     * @param employees Employee wallet addresses
     * @param salaries Corresponding salary amounts
     * @param frequency Payment frequency (typically BIWEEKLY)
     */
    function createPayrollFlow(
        address potAddress,
        address[] memory employees,
        uint256[] memory salaries,
        Frequency frequency
    ) external returns (bytes32) {
        return createFlow(
            FlowType.PAYROLL,
            frequency,
            potAddress,
            employees,
            salaries,
            true, // Enable SalaryShield by default
            "Automated Payroll"
        );
    }

    /**
     * @notice Create recurring vendor payment Flow
     * @param potAddress Source Pot
     * @param vendors Vendor wallet addresses
     * @param amounts Payment amounts
     * @param frequency Payment frequency (typically MONTHLY)
     */
    function createVendorFlow(
        address potAddress,
        address[] memory vendors,
        uint256[] memory amounts,
        Frequency frequency
    ) external returns (bytes32) {
        return createFlow(
            FlowType.SUBSCRIPTION,
            frequency,
            potAddress,
            vendors,
            amounts,
            false,
            "Vendor Retainers"
        );
    }

    /**
     * @notice Cancel a Flow
     * @param flowId Flow identifier
     */
    function cancelFlow(bytes32 flowId) external {
        flows[flowId].isActive = false;
        emit FlowCancelled(flowId);
    }

    /**
     * @notice Get Flow details
     * @param flowId Flow identifier
     * @return Flow configuration
     */
    function getFlow(bytes32 flowId) external view returns (FlowConfig memory) {
        return flows[flowId];
    }

    /**
     * @notice Get all active Flows
     * @return Array of active Flow IDs
     */
    function getActiveFlows() external view returns (bytes32[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < flowIds.length; i++) {
            if (flows[flowIds[i]].isActive) {
                activeCount++;
            }
        }

        bytes32[] memory activeFlows = new bytes32[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < flowIds.length; i++) {
            if (flows[flowIds[i]].isActive) {
                activeFlows[index] = flowIds[i];
                index++;
            }
        }

        return activeFlows;
    }

    /**
     * @notice Internal: Execute payroll with temporal jitter (SalaryShield)
     */
    function _executePayrollWithJitter(FlowConfig storage flow) internal {
        // Generate randomized delays for each payment (50-200ms)
        uint256[] memory jitterDelays = new uint256[](flow.recipients.length);
        for (uint256 i = 0; i < flow.recipients.length; i++) {
            // Pseudo-random delay between 50-200ms
            jitterDelays[i] = 50 + (uint256(keccak256(abi.encodePacked(block.timestamp, i))) % 150);
        }

        // Execute via Pot's SalaryShield function
        Pot pot = Pot(flow.source);
        pot.executePayrollWithJitter(flow.recipients, flow.amounts, jitterDelays);
    }

    /**
     * @notice Internal: Execute batch payments
     */
    function _executeBatchPayments(FlowConfig storage flow) internal {
        Pot pot = Pot(flow.source);
        for (uint256 i = 0; i < flow.recipients.length; i++) {
            pot.executePayment(flow.recipients[i], flow.amounts[i], flow.description);
        }
    }

    /**
     * @notice Internal: Execute budget allocation
     */
    function _executeAllocation(FlowConfig storage flow) internal {
        require(flow.recipients.length > 0, "No recipients");
        require(flow.amounts.length > 0, "No amounts");

        // Note: Treasury must call Flow.executeFlow() or handle allocation directly
        // This function notifies the Pot to update its allocated budget
        // The actual USDC transfer should be done by Treasury before calling this
        Pot pot = Pot(flow.recipients[0]);
        pot.allocateBudget(flow.amounts[0]);
    }

    /**
     * @notice Internal: Get frequency interval in seconds
     */
    function _getFrequencyInterval(Frequency frequency) internal pure returns (uint256) {
        if (frequency == Frequency.DAILY) return 1 days;
        if (frequency == Frequency.WEEKLY) return 7 days;
        if (frequency == Frequency.BIWEEKLY) return 14 days;
        if (frequency == Frequency.MONTHLY) return 30 days;
        if (frequency == Frequency.QUARTERLY) return 90 days;
        if (frequency == Frequency.YEARLY) return 365 days;
        return 0;
    }
}
