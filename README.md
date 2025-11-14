# Knight-C: Military-Grade Treasury Infrastructure

**Built on Arc. Powered by Circle. Secured by smart contracts.**

Knights protect treasure. We protect yours.

## Overview

Knight-C is military-grade smart contract treasury infrastructure built on Arc blockchain that provides corporate treasuries with:

- **One Unified Global Treasury** - Real-time visibility across all funds on a single dashboard
- **Instant Cross-Border Settlement** - Sub-second finality via Arc, zero FX fees with USDC
- **Configurable Privacy** - Public budgets where transparency helps, private where confidentiality matters
- **Smart Contract Fraud Prevention** - Multi-sig approvals, beneficiary whitelists, time-locks enforced by code
- **Automated Budget Enforcement** - Departmental limits are smart contract state variables
- **Scheduled Distributions** - Recurring payments execute automatically via keeper network
- **Immutable Audit Trail** - Every transaction cryptographically verifiable on-chain
- **Defense-in-Depth Payroll Privacy** - SalaryShield Mode with temporal jitter obfuscation

## The Problem

Corporate treasuries face $1M-$2M+ in annual costs from:
- No real-time visibility across global accounts
- 3-5 day cross-border payments with 2-3% FX fees
- Budget overruns (15-20% annually) with no enforcement
- $1.8B annual fraud losses from Business Email Compromise
- Competitive intelligence leakage on public blockchains
- 25+ hours/week on manual reconciliation and payment processing

## The Solution

Knight-C provides treasury infrastructure **impossible to build** on traditional banking or any other blockchain:

### Three-Layer Architecture

#### Layer 1: Main Treasury (Smart Contract Wallet)
- Holds all company USDC deposited via Circle Gateway
- Central source of truth for global liquidity
- CFO controls top-level allocations

#### Layer 2: Departmental Pots (Configurable Privacy)
Smart contract "sub-accounts" for each department with:
- Allocated budget (enforced on-chain)
- Privacy setting (Public or Private via Arc's configurable privacy)
- Spending rules (approval thresholds, whitelists)
- Automated Flows (recurring distributions)

**Example Configuration:**
- Engineering Pot: **PRIVATE** ($2M) - Salary data is competitively sensitive
- Marketing Pot: **PUBLIC** ($500K) - Team wants transparency for accountability
- Operations Pot: **PUBLIC** ($750K) - Standard vendor relationships

#### Layer 3: Automated Flows (Treasury Operations)
- **Allocation Flows:** Monthly budget distributions Main Treasury → Pots
- **Payment Flows:** Batch payroll, vendor payments, subscriptions
- **Approval Flows:** Multi-signature thresholds (>$100K requires CFO + department head)
- **Enforcement Flows:** Budget validation before every transaction

### Hero Feature: SalaryShield Military-Grade Payroll

For ultra-sensitive payroll, Knight-C provides **defense-in-depth privacy:**

**Standard Private Pot:** Uses Arc's native shielding (external observers see "transaction occurred" but not amounts/recipients)

**SalaryShield Mode:** Adds proprietary temporal jitter technology
- Each payment executes with randomized 50-200ms delay
- Payments complete over ~10 seconds instead of simultaneously
- Even if Arc's privacy were compromised, timing analysis cannot link payments together
- **Military-grade privacy through multiple defense layers**

## Why Arc

Knight-C is **impossible to build** on any other blockchain:

1. **Configurable Privacy** - Public Marketing Pot + Private Engineering Pot in SAME treasury
2. **USDC as Native Gas** - Predictable costs ($0.82 for 50-employee payroll, every time)
3. **Sub-Second Finality** - 0.4-second deterministic finality via Malachite consensus
4. **Circle Platform Integration** - Gateway (on/off ramps), Yield (4% APY), complete financial infrastructure
5. **EVM Compatibility** - Standard Solidity/Hardhat/Wagmi stack

## Project Structure

```
knight-c/
├── contracts/              # Solidity smart contracts
│   ├── Treasury.sol       # Main treasury smart contract wallet
│   ├── Pot.sol            # Departmental pot implementation
│   ├── Flow.sol           # Automated flow execution
│   └── libraries/         # Shared libraries and utilities
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   └── pages/        # Application pages
│   └── public/
├── scripts/               # Deployment and utility scripts
├── test/                  # Smart contract tests
├── docs/                  # Documentation
└── hardhat.config.js      # Hardhat configuration
```

## Tech Stack

**Blockchain:**
- Arc blockchain (EVM-compatible)
- Solidity smart contracts
- Hardhat development environment

**Frontend:**
- React
- Wagmi (Web3 React hooks)
- Viem (Ethereum library)
- TailwindCSS

**Integration:**
- Circle Gateway SDK (USD ↔ USDC on/off ramps)
- Circle USDC (treasury operations)
- Circle Yield (USYC for idle reserves)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Arc testnet
npm run deploy:testnet

# Start frontend development server
cd frontend && npm run dev
```

## Demo Flow

1. **Setup** - CFO deposits $10M USDC via Circle Gateway
2. **Create Pots** - Engineering (Private), Marketing (Public), Operations (Public)
3. **Public Payment** - Marketing pays $80K to São Paulo agency (0.4s settlement)
4. **Private Payroll** - Engineering runs 50-employee payroll with Arc privacy
5. **SalaryShield Mode** - Same payroll with temporal jitter (defense-in-depth)
6. **Budget Enforcement** - Marketing prevented from overspending, requests reallocation
7. **Scheduled Flows** - Automated bi-weekly payroll, monthly retainers, quarterly subscriptions
8. **Instant Audit** - Generate Q4 report with 47 transactions in 5 seconds

## Track 3 Alignment

- Uses Circle Gateway & Arc
- Automated treasury operations via smart contracts
- Handles allocations (departmental Pots with enforced spending limits)
- Handles distributions (payroll, vendor payments, recurring subscriptions, cross-border settlements)
- Solves real treasury problems (data fragmentation, fraud, budget overruns, FX delays, compliance)
- Code functional & deployed to Arc testnet

## Annual Savings

For a typical mid-sized multinational treasury:
- **$250K+** in FX fees eliminated
- **$280K** average fraud incident prevented
- **$360K** in manual labor costs reduced
- **$10M+** in excess cash deployed productively
- **40 hours** per audit cycle saved

**Total: $1M-$2M+ annually**

## License

MIT

## Contact

Built for Track 3: Treasury & Payments Infrastructure

---

**Knight-C: Military-grade treasury infrastructure for the modern enterprise.**
