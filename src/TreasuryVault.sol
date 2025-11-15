// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title TreasuryVault
 * @notice Treasury management with departmental budget enforcement
 * @dev Manages USDC treasury with multi-sig approvals and budget controls
 */
contract TreasuryVault {
    address public immutable usdcToken;

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

    event PaymentExecuted(
        bytes32 indexed potId,
        address recipient,
        uint256 amount,
        uint256 timestamp
    );
    event BudgetReallocated(
        bytes32 indexed fromPot,
        bytes32 indexed toPot,
        uint256 amount
    );
    event TreasuryDeposit(
        address indexed from,
        uint256 amount,
        uint256 timestamp
    );

    address public cfo;
    mapping(address => bool) public approvers;

    modifier onlyCfo() {
        require(msg.sender == cfo, "Only CFO can execute this");
        _;
    }

    modifier onlyApprover(bytes32 potId) {
        require(_isApprover(potId, msg.sender), "Not approver");
        _;
    }

    constructor(address _cfo, address _usdcToken) {
        require(_cfo != address(0), "Invalid CFO");
        require(_usdcToken != address(0), "Invalid USDC");
        cfo = _cfo;
        usdcToken = _usdcToken;
        approvers[_cfo] = true;
    }

    // Deposit USDC to treasury (called by authorized depositors)
    function depositToTreasury(uint256 amount) external {
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        emit TreasuryDeposit(msg.sender, amount, block.timestamp);
    }

    function getTreasuryBalance() external view returns (uint256) {
        return IERC20(usdcToken).balanceOf(address(this));
    }

    function createPot(
        bytes32 potId,
        uint256 budget,
        address[] calldata _approvers,
        uint256 threshold
    ) external onlyCfo {
        require(pots[potId].budget == 0, "Pot exists");
        pots[potId] = Pot({
            budget: budget,
            spent: 0,
            approvers: _approvers,
            threshold: threshold
        });
    }

    function addBeneficiary(
        bytes32 potId,
        address beneficiary
    ) external onlyCfo {
        whitelist[potId][beneficiary] = true;
    }

    function submitPayment(
        bytes32 potId,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bytes32) {
        require(recipients.length == amounts.length, "Length mismatch");
        uint256 total = _sum(amounts);
        Pot storage pot = pots[potId];
        require(pot.budget >= pot.spent + total, "Exceeds budget");

        bytes32 txHash = keccak256(
            abi.encodePacked(potId, recipients, amounts, block.timestamp)
        );

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

    function approvePayment(
        bytes32 txHash
    ) external onlyApprover(pending[txHash].potId) {
        PendingPayment storage payment = pending[txHash];
        require(!payment.executed, "Executed");
        require(!hasApproved[txHash][msg.sender], "Already approved");

        hasApproved[txHash][msg.sender] = true;
        payment.approvalCount++;

        Pot storage pot = pots[payment.potId];
        uint256 required = (pot.approvers.length / 2) + 1;

        if (payment.approvalCount >= required) {
            _executeBatchPayment(
                payment.potId,
                payment.recipients,
                payment.amounts
            );
            payment.executed = true;
        }
    }

    function _executeBatchPayment(
        bytes32 potId,
        address[] memory recipients,
        uint256[] memory amounts
    ) internal {
        Pot storage pot = pots[potId];
        for (uint i = 0; i < recipients.length; i++) {
            require(whitelist[potId][recipients[i]], "Not whitelisted");
            pot.spent += amounts[i];
            require(
                IERC20(usdcToken).transfer(recipients[i], amounts[i]),
                "Transfer failed"
            );
            emit PaymentExecuted(
                potId,
                recipients[i],
                amounts[i],
                block.timestamp
            );
        }
    }

    function reallocate(
        bytes32 fromPot,
        bytes32 toPot,
        uint256 amount
    ) external onlyCfo {
        Pot storage source = pots[fromPot];
        require(source.budget - source.spent >= amount, "Insufficient");
        source.budget -= amount;
        pots[toPot].budget += amount;
        emit BudgetReallocated(fromPot, toPot, amount);
    }

    function addApprover(address approver) external onlyCfo {
        approvers[approver] = true;
    }

    function getPotDetails(
        bytes32 potId
    ) external view returns (uint256 budget, uint256 spent, uint256 threshold) {
        Pot storage pot = pots[potId];
        return (pot.budget, pot.spent, pot.threshold);
    }

    function _sum(
        uint256[] memory amounts
    ) internal pure returns (uint256 total) {
        for (uint i = 0; i < amounts.length; i++) total += amounts[i];
    }

    function _isApprover(
        bytes32 potId,
        address user
    ) internal view returns (bool) {
        address[] memory _approvers = pots[potId].approvers;
        for (uint i = 0; i < _approvers.length; i++) {
            if (_approvers[i] == user) return true;
        }
        return false;
    }
}
