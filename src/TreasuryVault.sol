// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title TreasuryVault
 * @notice Unified treasury with departmental budget enforcement
 * @dev Simplified single-contract architecture for Knight-C
 *
 * Architecture:
 * - Layer 1: Main Treasury (unified USDC)
 * - Layer 2: Departmental Pots (budget enforcement)
 * - Layer 3: Payment Flows (approval + batch + reallocation)
 */
contract TreasuryVault {
    address constant USDC = 0x3600000000000000000000000000000000000000;

    struct Pot {
        uint256 budget;
        uint256 spent;
        address[] approvers;
        uint256 threshold;
    }

    mapping(bytes32 => Pot) public pots;
    mapping(bytes32 => mapping(address => bool)) public whitelist;

    struct PendingPayment {
        bytes32 potId;
        address[] recipients;
        uint256[] amounts;
        uint256 approvalCount;
        bool executed;
    }

    mapping(bytes32 => PendingPayment) public pending;
    mapping(bytes32 => mapping(address => bool)) public hasApproved;
    bytes32[] public pendingQueue;

    event PaymentExecuted(bytes32 indexed potId, address recipient, uint256 amount, uint256 timestamp);
    event BudgetReallocated(bytes32 indexed fromPot, bytes32 indexed toPot, uint256 amount);

    // CRITICAL FIX: Explicit getters for structs with dynamic arrays
    function getPotDetails(bytes32 potId) external view returns (
        uint256 budget,
        uint256 spent,
        uint256 threshold
    ) {
        Pot storage pot = pots[potId];
        return (pot.budget, pot.spent, pot.threshold);
    }

    address public cfo;
    mapping(address => bool) public approvers;

    modifier onlyCfo() {
        _onlyCfo();
        _;
    }

    function _onlyCfo() internal view {
        require(msg.sender == cfo, "Only CFO can execute this");
    }

    modifier onlyApprover(bytes32 potId) {
        _onlyApprover(potId);
        _;
    }

    function _onlyApprover(bytes32 potId) internal view {
        require(_isApprover(potId, msg.sender), "Not approver");
    }

    constructor(address _cfo) {
        cfo = _cfo;
        approvers[_cfo] = true;
    }


    function depositToTreasury(uint256 amount) external {
        require(IERC20(USDC).transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
    }

    function createPot(bytes32 potId, uint256 budget, address[] calldata _approvers, uint256 threshold) external onlyCfo {
        pots[potId] = Pot({
            budget: budget,
            spent: 0,
            approvers: _approvers,
            threshold: threshold
        });
    }

    function addBeneficiary(bytes32 potId, address beneficiary) external onlyCfo {
        whitelist[potId][beneficiary] = true;
    }

    function submitPayment(bytes32 potId, address[] calldata recipients, uint256[] calldata amounts) external returns (bytes32) {
        uint256 total = _sum(amounts);
        Pot storage pot = pots[potId];
        require(pot.budget >= pot.spent + total, "Exceeds budget");

        bytes32 txHash = keccak256(abi.encodePacked(potId, recipients, amounts, block.timestamp));

        if (total <= pot.threshold) {
            _executeBatchPayment(potId, recipients, amounts);
            return txHash;
        }

        pending[txHash] = PendingPayment({
            potId: potId,
            recipients: recipients,
            amounts: amounts,
            approvalCount: 0,
            executed: false
        });
        pendingQueue.push(txHash);
        return txHash;
    }

    function approvePayment(bytes32 txHash) external onlyApprover(pending[txHash].potId) {
        PendingPayment storage payment = pending[txHash];
        require(!payment.executed, "Executed");
        require(!hasApproved[txHash][msg.sender], "Already approved");

        hasApproved[txHash][msg.sender] = true;
        payment.approvalCount++;

        Pot storage pot = pots[payment.potId];
        uint256 required = (pot.approvers.length / 2) + 1;

        if (payment.approvalCount >= required) {
            _executeBatchPayment(payment.potId, payment.recipients, payment.amounts);
            payment.executed = true;
        }
    }

    function _executeBatchPayment(bytes32 potId, address[] memory recipients, uint256[] memory amounts) internal {
        Pot storage pot = pots[potId];
        for (uint i = 0; i < recipients.length; i++) {
            require(whitelist[potId][recipients[i]], "Not whitelisted");
            pot.spent += amounts[i];
            require(IERC20(USDC).transfer(recipients[i], amounts[i]), "USDC transfer failed");
            emit PaymentExecuted(potId, recipients[i], amounts[i], block.timestamp);
        }
    }

    function reallocate(bytes32 fromPot, bytes32 toPot, uint256 amount) external onlyCfo {
        Pot storage source = pots[fromPot];
        require(source.budget - source.spent >= amount, "Insufficient");
        source.budget -= amount;
        pots[toPot].budget += amount;
        emit BudgetReallocated(fromPot, toPot, amount);
    }

    function addApprover(address approver) external onlyCfo {
        approvers[approver] = true;
    }

    function removeApprover(address approver) external onlyCfo {
        approvers[approver] = false;
    }

    function _sum(uint256[] memory amounts) internal pure returns (uint256 total) {
        for (uint i = 0; i < amounts.length; i++) total += amounts[i];
    }

    function _isApprover(bytes32 potId, address user) internal view returns (bool) {
        address[] memory _approvers = pots[potId].approvers;
        for (uint i = 0; i < _approvers.length; i++) {
            if (_approvers[i] == user) return true;
        }
        return false;
    }
}
