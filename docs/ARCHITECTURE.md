# Knight-C Architecture

## Overview

Knight-C is a three-layer smart contract system providing military-grade treasury infrastructure on Arc blockchain.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Circle Gateway                           │
│                   (USD ↔ USDC)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 1: Main Treasury                         │
│                                                               │
│  • Holds all company USDC                                    │
│  • Central source of truth for global liquidity             │
│  • CFO controls top-level allocations                       │
│  • Multi-signature approval system                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 2: Departmental Pots                     │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Engineering │  │  Marketing  │  │ Operations  │         │
│  │   (Private) │  │   (Public)  │  │   (Public)  │         │
│  │   $2M       │  │   $500K     │  │   $750K     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  Each Pot has:                                               │
│  • Allocated budget (enforced on-chain)                     │
│  • Privacy setting (Arc configurable privacy)               │
│  • Spending rules (approval thresholds, whitelists)         │
│  • Automated Flows (recurring distributions)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            LAYER 3: Automated Flows                         │
│                                                               │
│  • Allocation Flows: Monthly budget distributions           │
│  • Payment Flows: Batch payroll, vendor payments            │
│  • Approval Flows: Multi-sig thresholds                     │
│  • Enforcement Flows: Budget validation                     │
└─────────────────────────────────────────────────────────────┘
```

## Smart Contract Architecture

### Treasury.sol
Main treasury smart contract wallet that:
- Holds all company USDC
- Creates and manages departmental Pots
- Handles CFO-level operations
- Enforces multi-signature requirements

**Key Functions:**
- `fundTreasury(amount)` - Deposit USDC via Circle Gateway
- `createPot(name, budget, isPrivate, threshold)` - Create departmental Pot
- `allocateToPot(potId, amount)` - Transfer funds to Pot
- `getTotalBalance()` - Get total treasury balance

### Pot.sol
Departmental smart contract sub-account that:
- Manages allocated budget
- Executes payments with budget enforcement
- Implements privacy settings via Arc
- Maintains beneficiary whitelist

**Key Functions:**
- `executePayment(recipient, amount, purpose)` - Execute single payment
- `executePayrollWithJitter(recipients, amounts, delays)` - SalaryShield payroll
- `whitelistBeneficiary(address)` - Add to approved recipients
- `getRemainingBudget()` - Check available funds

### Flow.sol
Automated treasury operations that:
- Schedules recurring payments
- Executes batch distributions
- Manages payment frequencies
- Implements temporal jitter for privacy

**Key Functions:**
- `createFlow(type, frequency, source, recipients, amounts)` - Create automated Flow
- `executeFlow(flowId)` - Run scheduled Flow (called by keeper network)
- `createPayrollFlow(pot, employees, salaries, frequency)` - Payroll-specific Flow

## Data Flow

### Payment Execution Flow
1. Department manager initiates payment
2. System validates:
   - Recipient is whitelisted
   - Budget is sufficient
   - Amount is within limits
3. If above threshold → Multi-sig approval required
4. Payment executes via Arc (public or private transaction)
5. Budget auto-decrements
6. Transaction logged on-chain

### SalaryShield Flow (Defense-in-Depth)
1. Upload payroll CSV (50 employees, $120K total)
2. Multi-sig approval (Engineering VP + CFO)
3. Generate randomized jitter delays (50-200ms per payment)
4. Execute payments sequentially with delays:
   - Employee 1 at T+0ms
   - Employee 2 at T+127ms
   - Employee 3 at T+63ms
   - ... (random distribution)
5. All payments complete within ~10 seconds
6. External observers see independent transactions, not batch

## Privacy Implementation

### Arc Configurable Privacy
- **Public Pots**: Standard transparent transactions (Marketing, Operations)
- **Private Pots**: Arc shielded transactions (Engineering, HR)
- **View Keys**: CFO has authorized access to private Pot data
- **Selective Disclosure**: Compliance-friendly privacy

### Temporal Jitter (SalaryShield)
Additional privacy layer for payroll:
- Randomized execution delays
- Prevents timing analysis
- Defense-in-depth approach
- Military-grade confidentiality

## Security Model

### Budget Enforcement
Budgets are smart contract state variables:
```solidity
uint256 public allocatedBudget;
uint256 public spentAmount;

modifier hasBudget(uint256 amount) {
    require(allocatedBudget - spentAmount >= amount, "Insufficient budget");
    _;
}
```
System **mathematically cannot** allow overspending.

### Fraud Prevention
- Beneficiary whitelist (cannot pay unauthorized addresses)
- Multi-signature approvals (cannot be socially engineered)
- Time-locks on high-value transfers
- Immutable audit trail

### Multi-Signature Workflow
```
Payment > $100K → Requires CFO + Department Head signatures
Payment < $100K → Department Head only
```

## Arc-Specific Features

### Why Arc is Critical
1. **Configurable Privacy** - Public + Private Pots in same treasury
2. **USDC Native Gas** - Predictable costs ($0.82 for 50-employee payroll)
3. **Sub-Second Finality** - 0.4s deterministic finality
4. **Circle Integration** - Gateway, Yield, Mint ecosystem
5. **EVM Compatibility** - Standard Solidity development

### Circle Ecosystem Integration
- **Circle Gateway**: USD ↔ USDC on/off ramps
- **Circle Yield (USYC)**: 4% APY on idle treasury reserves
- **Circle CCTP**: Cross-chain USDC transfers
- **Circle Contracts**: Financial primitives

## Scalability

### Gas Optimization
- Batch payments reduce per-transaction costs
- Optimized storage patterns
- Minimal on-chain computation

### Performance Metrics
- **Payment Settlement**: 0.4 seconds (Arc finality)
- **Payroll Execution**: ~10 seconds for 50 employees (with jitter)
- **Audit Report Generation**: 5 seconds (on-chain query)
- **Dashboard Updates**: Real-time (0.4s block time)

## Future Enhancements

### Planned Features
- Integration with Circle Yield for automatic treasury optimization
- Advanced analytics dashboard
- Recurring vendor payment templates
- Cross-border FX hedging
- Multi-currency support beyond USDC

### Scalability Roadmap
- Layer 2 integration for ultra-low-cost microtransactions
- Batch processing optimization
- Advanced privacy features (zero-knowledge proofs)
