# Knight-C Smart Contract API Reference

## Treasury Contract

Main treasury smart contract wallet that manages company funds and departmental Pots.

### Read Functions

#### `getTotalBalance() → uint256`
Returns the total USDC balance across all Pots and main treasury.

```solidity
uint256 totalBalance = treasury.getTotalBalance();
```

#### `getAllPots() → bytes32[]`
Returns array of all Pot identifiers.

```solidity
bytes32[] memory potIds = treasury.getAllPots();
```

#### `approvers(address) → bool`
Check if an address is an authorized approver.

```solidity
bool isApprover = treasury.approvers(userAddress);
```

#### `cfo() → address`
Returns the CFO address (main treasury admin).

### Write Functions

#### `fundTreasury(uint256 amount)`
Deposit USDC into the treasury (via Circle Gateway).

**Parameters:**
- `amount`: Amount in USDC (6 decimals)

**Requirements:**
- Caller must have sufficient USDC
- USDC approval for treasury contract

```solidity
// Deposit $1M USDC
treasury.fundTreasury(1_000_000 * 10**6);
```

#### `createPot(string name, uint256 budget, bool isPrivate, uint256 approvalThreshold) → bytes32`
Create a new departmental Pot with allocated budget.

**Parameters:**
- `name`: Department name (e.g., "Engineering")
- `budget`: Initial budget in USDC (6 decimals)
- `isPrivate`: Enable Arc privacy features (roadmap)
- `approvalThreshold`: Amount requiring CFO approval

**Returns:** Pot identifier (bytes32)

**Access:** CFO only

```solidity
// Create Engineering Pot with $2M budget, private, $100K threshold
bytes32 potId = treasury.createPot(
    "Engineering",
    2_000_000 * 10**6,
    true,
    100_000 * 10**6
);
```

#### `allocateToPot(bytes32 potId, uint256 amount)`
Transfer additional funds from main treasury to a Pot.

**Parameters:**
- `potId`: Target Pot identifier
- `amount`: Amount in USDC

**Access:** CFO only

```solidity
// Allocate $500K to Marketing Pot
treasury.allocateToPot(marketingPotId, 500_000 * 10**6);
```

#### `addApprover(address approver)`
Add an address to the approver list for multi-sig workflows.

**Access:** CFO only

#### `removeApprover(address approver)`
Remove an address from the approver list.

**Access:** CFO only

---

## Pot Contract

Departmental smart contract sub-account with enforced budget limits.

### Read Functions

#### `getRemainingBudget() → uint256`
Get available budget remaining in the Pot.

```solidity
uint256 remaining = pot.getRemainingBudget();
```

#### `getBudgetUtilization() → uint256`
Get percentage of budget spent (0-100).

```solidity
uint256 utilization = pot.getBudgetUtilization(); // Returns 84 for 84%
```

#### `allocatedBudget() → uint256`
Total budget allocated to this Pot.

#### `spentAmount() → uint256`
Total amount spent from this Pot.

#### `whitelist(address) → bool`
Check if an address is whitelisted for payments.

#### `getPaymentCount() → uint256`
Get total number of payments executed from this Pot.

### Write Functions

#### `executePayment(address recipient, uint256 amount, string purpose)`
Execute a single payment from the Pot.

**Parameters:**
- `recipient`: Beneficiary address (must be whitelisted)
- `amount`: Payment amount in USDC
- `purpose`: Payment description

**Requirements:**
- Recipient must be whitelisted
- Sufficient budget available
- Multi-sig approval if above threshold

```solidity
// Pay agency $80K
pot.executePayment(
    agencyAddress,
    80_000 * 10**6,
    "Q4 Marketing Campaign"
);
```

#### `executePayrollWithJitter(address[] recipients, uint256[] amounts, uint256[] jitterDelays)`
Execute batch payroll with temporal jitter (SalaryShield - Roadmap feature).

**Parameters:**
- `recipients`: Array of employee addresses
- `amounts`: Corresponding payment amounts
- `jitterDelays`: Randomized delays (50-200ms)

**Requirements:**
- All recipients must be whitelisted
- Total amount within budget
- Multi-sig approval if above threshold

```solidity
// Execute payroll for 50 employees
address[] memory employees = [...];
uint256[] memory salaries = [...];
uint256[] memory delays = [...];

pot.executePayrollWithJitter(employees, salaries, delays);
```

#### `whitelistBeneficiary(address beneficiary)`
Add an address to the approved payment recipients list.

**Access:** Pot manager or CFO

```solidity
pot.whitelistBeneficiary(vendorAddress);
```

#### `approvePayment(bytes32 paymentId)`
Approve a payment pending multi-sig (for transactions above threshold).

**Access:** Authorized approvers

---

## Flow Contract

Automated treasury operations for recurring payments.

### Read Functions

#### `getActiveFlows() → bytes32[]`
Returns array of all active Flow identifiers.

```solidity
bytes32[] memory activeFlows = flow.getActiveFlows();
```

#### `getFlow(bytes32 flowId) → FlowConfig`
Get configuration for a specific Flow.

**Returns:**
```solidity
struct FlowConfig {
    FlowType flowType;
    Frequency frequency;
    address source;
    address[] recipients;
    uint256[] amounts;
    uint256 nextExecution;
    bool isActive;
    bool useSalaryShield;
    string description;
}
```

### Write Functions

#### `createFlow(...) → bytes32`
Create a new automated Flow for recurring payments.

**Parameters:**
- `flowType`: ALLOCATION, PAYMENT, PAYROLL, or SUBSCRIPTION
- `frequency`: DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY
- `source`: Source Pot address
- `recipients`: Beneficiary addresses
- `amounts`: Payment amounts
- `useSalaryShield`: Enable temporal jitter (roadmap)
- `description`: Flow description

**Returns:** Flow identifier

```solidity
// Create bi-weekly payroll Flow
bytes32 flowId = flow.createFlow(
    Flow.FlowType.PAYROLL,
    Flow.Frequency.BIWEEKLY,
    engineeringPotAddress,
    employees,
    salaries,
    true, // SalaryShield enabled
    "Engineering Payroll"
);
```

#### `createPayrollFlow(address potAddress, address[] employees, uint256[] salaries, Frequency frequency) → bytes32`
Convenience function for creating payroll Flows.

**Parameters:**
- `potAddress`: Source Pot
- `employees`: Employee wallet addresses
- `salaries`: Corresponding salaries
- `frequency`: Payment frequency

```solidity
// Bi-weekly engineering payroll
flow.createPayrollFlow(
    engineeringPot,
    employees,
    salaries,
    Flow.Frequency.BIWEEKLY
);
```

#### `createVendorFlow(address potAddress, address[] vendors, uint256[] amounts, Frequency frequency) → bytes32`
Convenience function for vendor payment Flows.

#### `executeFlow(bytes32 flowId)`
Manually execute a Flow (in production, called by keeper network).

**Access:** Anyone (intended for Chainlink Keepers)

#### `cancelFlow(bytes32 flowId)`
Deactivate a Flow (stops automatic execution).

**Access:** CFO or Flow creator

---

## Events

### Treasury Events

```solidity
event TreasuryFunded(address indexed from, uint256 amount);
event PotCreated(bytes32 indexed potId, string name, bool isPrivate, uint256 budget);
event FundsAllocated(bytes32 indexed potId, uint256 amount);
event ApproverAdded(address indexed approver);
event ApproverRemoved(address indexed approver);
```

### Pot Events

```solidity
event BudgetAllocated(uint256 amount, uint256 newTotal);
event PaymentExecuted(address indexed recipient, uint256 amount, string purpose);
event PaymentApproved(bytes32 indexed paymentId, address indexed approver);
event BeneficiaryWhitelisted(address indexed beneficiary);
event BudgetExceeded(uint256 requested, uint256 available);
```

### Flow Events

```solidity
event FlowCreated(bytes32 indexed flowId, FlowType flowType, Frequency frequency);
event FlowExecuted(bytes32 indexed flowId, uint256 timestamp, uint256 totalAmount);
event FlowCancelled(bytes32 indexed flowId);
```

---

## Error Codes

Common revert messages:

### Treasury
- `"Only CFO can execute this"` - Unauthorized access to CFO-only function
- `"Only treasury can execute this"` - Unauthorized access to treasury-only function

### Pot
- `"Insufficient budget"` - Attempted payment exceeds available budget
- `"Recipient not whitelisted"` - Payment to non-whitelisted address
- `"Insufficient approvals"` - Multi-sig threshold not met
- `"Only manager can execute this"` - Unauthorized access to manager function

### Flow
- `"Array length mismatch"` - Recipients/amounts arrays have different lengths
- `"Flow is not active"` - Attempted to execute cancelled Flow
- `"Not ready for execution"` - Flow executed before scheduled time

---

## Gas Costs (Estimated)

Based on Arc's target of ~$0.01 USDC gas fees:

| Operation | Estimated Gas | Approx Cost |
|-----------|--------------|-------------|
| Fund Treasury | ~50,000 gas | ~$0.01 |
| Create Pot | ~200,000 gas | ~$0.01 |
| Execute Payment | ~80,000 gas | ~$0.01 |
| Batch Payroll (50) | ~500,000 gas | ~$0.51 |
| Whitelist Beneficiary | ~45,000 gas | ~$0.01 |
| Create Flow | ~150,000 gas | ~$0.01 |

**Note:** Actual costs depend on Arc network conditions. USDC gas pricing makes costs predictable.

---

## Integration Examples

### Frontend (React + Wagmi)

```typescript
import { useWriteContract } from 'wagmi';
import { TREASURY_ABI, TREASURY_ADDRESS } from './lib/contracts';

function CreatePot() {
  const { writeContract } = useWriteContract();

  const createPot = async () => {
    await writeContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'createPot',
      args: [
        'Engineering',
        2000000000000n, // $2M USDC (6 decimals)
        true, // Private
        100000000000n, // $100K threshold
      ],
    });
  };

  return <button onClick={createPot}>Create Engineering Pot</button>;
}
```

### Backend (ethers.js)

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const treasury = new ethers.Contract(TREASURY_ADDRESS, TREASURY_ABI, wallet);

// Execute batch payroll
async function runPayroll() {
  const pot = new ethers.Contract(POT_ADDRESS, POT_ABI, wallet);

  const tx = await pot.executePayrollWithJitter(
    employees,
    salaries,
    jitterDelays
  );

  const receipt = await tx.wait();
  console.log('Payroll executed:', receipt.hash);
}
```
