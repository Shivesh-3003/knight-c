# Knight-C Treasury Platform

Knight-C is a simplified treasury management system built on Arc Network, featuring unified USDC management with departmental budget enforcement and multi-signature approvals.

## Architecture

**Layer 1: Main Treasury** - Unified USDC vault
**Layer 2: Departmental Pots** - Budget enforcement per department
**Layer 3: Payment Flows** - Approval workflows + batch payments + reallocation

**Hero Features:**
- Sub-second finality (Arc Network)
- Mathematical budget enforcement (on-chain)
- Multi-signature approvals
- Real-time budget reallocation

## Tech Stack

- **Blockchain**: Arc Network Testnet
- **Smart Contract**: TreasuryVault.sol (Solidity 0.8.18)
- **Frontend**: React + Vite + wagmi
- **Gas Token**: USDC (not ETH)

## Quick Start

### 1. Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Setup Environment

Create `.env` file:

```
PRIVATE_KEY=your_private_key
TREASURY_ADDRESS=deployed_contract_address
CFO_ADDRESS=cfo_wallet_address
ENG_VP_ADDRESS=engineering_vp_address
```

### 3. Deploy Contract

```bash
npx hardhat run scripts/deploy.ts --network arc
```

### 4. Setup Pots

```bash
npx hardhat run scripts/setup.ts --network arc
```

### 5. Run Frontend

```bash
cd frontend
npm run dev
```

## Contract Structure

### TreasuryVault.sol

**Key Functions:**
- `depositToTreasury(amount)` - Fund the treasury
- `createPot(potId, budget, approvers, threshold)` - Create department pot
- `addBeneficiary(potId, beneficiary)` - Whitelist payment recipient
- `submitPayment(potId, recipients, amounts)` - Execute/queue payment
- `approvePayment(txHash)` - Approve pending payment
- `reallocate(fromPot, toPot, amount)` - Reallocate budget between pots
- `getPotDetails(potId)` - Get pot budget/spent/threshold
- `getPendingDetails(txHash)` - Get pending payment details

## Demo Flow

**Act 1**: Show dashboard - $10M treasury, 3 departmental pots
**Act 2**: Marketing pays $80K → sub-second finality → ~1¢ gas
**Act 3**: Engineering VP submits $120K payroll → requires 2/2 approvals → CFO approves → executes
**Act 4**: Marketing tries $450K (only $420K available) → blocked → CFO reallocates $30K from Operations → succeeds
**Act 5**: Show scheduled flows mockup (roadmap)
**Act 6**: Generate audit report from on-chain events
**Act 7**: Privacy features roadmap

## Arc Network Info

- **RPC**: https://rpc.testnet.arc.network
- **Chain ID**: 5042002
- **USDC Address**: 0x3600000000000000000000000000000000000000
- **Explorer**: https://testnet.arcscan.app
- **Faucet**: https://faucet.circle.com

## Project Structure

```
knight-c/
├── contracts/
│   └── TreasuryVault.sol          # Single unified contract
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ApprovalQueue.tsx
│       │   ├── ReallocationModal.tsx
│       │   ├── AuditReport.tsx
│       │   └── ScheduledFlows.tsx
│       └── lib/
│           ├── contracts.ts
│           ├── utils.ts
│           └── wagmi.ts
├── scripts/
│   ├── deploy.ts                  # Deploy TreasuryVault
│   └── setup.ts                   # Create initial pots
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── hardhat.config.ts
└── README.md
```

## Features

### ✅ TIER 1 (Built)
- Unified Treasury
- Instant Settlement (Arc)
- Budget Enforcement
- Multi-sig Approvals
- Whitelist Protection
- Budget Reallocation
- Audit Trail

### ⚠️ Roadmap
- Scheduled Flows (Chainlink Automation)
- Privacy Features (Arc privacy module)
- Cross-chain USDC (Circle Gateway)

## License

MIT
