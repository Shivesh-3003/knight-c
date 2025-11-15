# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Knight-C is a treasury management platform built on Arc Network, featuring unified USDC management with departmental budget enforcement and multi-signature approvals. It combines blockchain technology with Circle's payment infrastructure.

**Tech Stack:**
- Smart Contracts: Solidity 0.8.18 (Foundry framework)
- Blockchain: Arc Network Testnet (Chain ID: 5042002)
- Frontend: React + Vite + TypeScript + wagmi/viem
- Backend: Express + TypeScript + viem
- Cross-Chain Integration: Circle Gateway (cross-chain USDC transfers)
- Gas Token: USDC (not ETH)

## Common Development Commands

### Smart Contract Development (Foundry)

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy to Arc Testnet (requires PRIVATE_KEY in .env)
forge script script/Deploy.s.sol:Deploy --rpc-url $ARC_TESTNET_RPC_URL --broadcast --legacy

# Verify contract on Arc Explorer
forge verify-contract <CONTRACT_ADDRESS> src/TreasuryVault.sol:TreasuryVault --chain 5042002 --watch
```

### Frontend Development

```bash
# Install dependencies
cd frontend && npm install

# Run development server
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Backend Development

```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production server
npm start
```

### Circle Gateway Treasury Funding (Scripts)

```bash
# Fund treasury via Circle Gateway (cross-chain USDC transfer from Sepolia to Arc)
# Requires: USDC on Ethereum Sepolia, PRIVATE_KEY in .env, TREASURY_CONTRACT_ADDRESS in .env
ts-node scripts/fund-treasury-via-gateway.ts
```

## Architecture

### Three-Layer System

**Layer 1: Main Treasury** - Unified USDC vault managed by CFO
**Layer 2: Departmental Pots** - Budget-enforced sub-accounts per department
**Layer 3: Payment Flows** - Approval workflows + batch payments + reallocation

### Hybrid Integration Model

The system combines two separate infrastructures:

1. **Circle Gateway (Cross-Chain USDC Transfers)**
   - Enables instant cross-chain USDC transfers (<500ms)
   - Provides unified USDC balance across multiple blockchains
   - Uses Gateway Wallet contracts + attestation service
   - Location: `backend/src/services/circle.service.ts`
   - Note: NOT a fiat on-ramp - handles cross-chain USDC movement only

2. **TreasuryVault Smart Contract (Arc Blockchain)**
   - Enforces departmental budgets on-chain
   - Manages multi-signature approvals
   - Executes payments and reallocations
   - Location: `src/TreasuryVault.sol`

3. **Frontend Integration**
   - REST API calls via axios: `frontend/src/lib/api.ts`
   - Web3 interactions via wagmi: `frontend/src/lib/wagmi.ts`
   - Contract configuration: `frontend/src/lib/contract.ts`

### Data Flow

```
CFO has USDC on Ethereum Sepolia
    → Deposit to Gateway Wallet contract (creates unified USDC balance)
    → Wait for finality (~12-15 min, ~32 blocks)
    → Create BurnIntent with EIP-712 (sourceDomain: 0, destinationDomain: 26)
    → Sign BurnIntent with private key
    → POST signed BurnIntent to Gateway API
    → Receive attestation + signature from API
    → Call gatewayMint(attestation, signature) on Arc
    → USDC instantly minted on Arc (<500ms)
    → Deposit USDC to TreasuryVault contract on Arc
    → CFO creates departmental pots via Web3
    → Contract enforces budgets automatically
    → Department managers execute payments
    → Multi-sig approvals when needed
```

## Smart Contract Architecture

### TreasuryVault.sol (`src/TreasuryVault.sol`)

The single unified smart contract that manages all treasury operations.

**Core Data Structures:**
- `Pot`: Departmental budget with approvers and spending threshold
- `PendingPayment`: Multi-sig payment awaiting approvals
- Mappings for pots, whitelists, pending payments, and approvals

**Key Functions:**
- `depositToTreasury(amount)` - Fund the main treasury
- `createPot(potId, budget, approvers, threshold)` - Create department with budget
- `addBeneficiary(potId, beneficiary)` - Whitelist payment recipient
- `submitPayment(potId, recipients, amounts)` - Execute or queue payment
- `approvePayment(txHash)` - Approve pending multi-sig payment
- `reallocate(fromPot, toPot, amount)` - Move funds between departments
- `getPotDetails(potId)` - View pot budget/spent/threshold
- `getPendingDetails(txHash)` - View pending payment details

**Security Features:**
- Mathematical budget enforcement (cannot overspend)
- Beneficiary whitelist (cannot pay unauthorized addresses)
- Multi-signature approvals for threshold amounts
- Immutable audit trail via events

## Frontend Structure

### Component Organization

**Core Components** (`frontend/src/components/`):
- `ApprovalQueue.tsx` - Multi-sig approval interface
- `BatchPaymentModal.tsx` - Execute multiple payments
- `SinglePaymentModal.tsx` - Execute single payment
- `CreatePotModal.tsx` - Create departmental budget
- `ReallocationModal.tsx` - Transfer funds between pots
- `TreasuryFunding.tsx` - Deposit USDC to treasury
- `WalletConnect.tsx` - Web3 wallet connection UI
- `Layout.tsx` + `Sidebar.tsx` - App shell

**Pages** (`frontend/src/pages/`):
- `Dashboard.tsx` - Treasury overview and pot management
- `Approvals.tsx` - Multi-sig approval queue
- `Compliance.tsx` - Audit reports and transaction history
- `ScheduledFlows.tsx` - Recurring payment automation (roadmap)

**Library Files** (`frontend/src/lib/`):
- `api.ts` - Circle Gateway REST API client (axios)
- `wagmi.ts` - Web3 configuration (Arc chain, wallet connectors)
- `contract.ts` - TreasuryVault address and validation
- `constants.ts` - App-wide constants (USDC address, etc.)
- `utils.ts` - Helper functions (formatting, validation)

## Arc Network Specifics

**Network Configuration:**
- Chain ID: `5042002` (hex: `0x4cef52`)
- RPC: `https://rpc.testnet.arc.network`
- WebSocket: `wss://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Faucet: `https://faucet.circle.com`

**USDC on Arc:**
- Address: `0x3600000000000000000000000000000000000000`
- Decimals: 6 (1 USDC = 1,000,000 smallest units)
- Used as gas token (not ETH)
- Native Circle integration

**Arc-Specific Considerations:**
- Sub-second finality (~0.4s)
- Gas costs paid in USDC (predictable pricing)
- Configurable privacy features available (roadmap)
- EVM-compatible (standard Solidity)

## Environment Variables

### Root `.env` (Smart Contract Deployment)

```bash
PRIVATE_KEY=<deployer_wallet_private_key>
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```

### Frontend `.env` (`frontend/.env`)

```bash
VITE_TREASURY_ADDRESS=<deployed_treasuryvault_address>
VITE_USDC_ADDRESS=0x3600000000000000000000000000000000000000
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_CHAIN_ID=5042002
VITE_WALLETCONNECT_PROJECT_ID=<walletconnect_project_id>
VITE_API_BASE_URL=http://localhost:3000
```

### Backend `.env` (`backend/.env`)

```bash
CIRCLE_API_KEY=<circle_api_key>
PRIVATE_KEY=<deployer_wallet_private_key>
TREASURY_CONTRACT_ADDRESS=<deployed_treasuryvault_address>
PORT=3000

# Gateway Contract Addresses (pre-deployed by Circle)
GATEWAY_WALLET_ADDRESS=0x0077777d7EBA4688BDeF3E311b846F25870A19B9
GATEWAY_MINTER_ADDRESS=0x0022222ABE238Cc2C7Bb1f21003F0a260052475B

# Network RPC URLs
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
```

## Key Workflows

### Deploying the Smart Contract

1. Get testnet USDC for gas: https://faucet.circle.com
2. Set `PRIVATE_KEY` in root `.env`
3. Run: `forge script script/Deploy.s.sol:Deploy --rpc-url $ARC_TESTNET_RPC_URL --broadcast --legacy`
4. Update `VITE_TREASURY_ADDRESS` in `frontend/.env` with deployed address
5. Verify contract: `forge verify-contract <ADDRESS> src/TreasuryVault.sol:TreasuryVault --chain 5042002`

### Setting Up Circle Gateway Integration

1. Get testnet USDC on Ethereum Sepolia from: https://faucet.circle.com
2. Get Sepolia ETH for gas from: https://sepolia-faucet.com
3. Update `.env` files with:
   - `PRIVATE_KEY` - Wallet with USDC on Sepolia
   - `TREASURY_CONTRACT_ADDRESS` - Deployed TreasuryVault on Arc
4. Gateway contract addresses are pre-deployed by Circle (already in `.env.example`)

**Important Notes:**
- Circle Gateway does NOT require a CIRCLE_API_KEY for transfers
- Gateway uses EIP-712 signed burn intents submitted to a public API endpoint
- Domain IDs: Sepolia = 0, Arc Testnet = 26

### Funding Treasury via Circle Gateway

**Option 1: Using the Automated Script (Recommended)**
```bash
# Set amount in .env (default: 1000 USDC)
DEPOSIT_AMOUNT=1000

# Run the funding script
ts-node scripts/fund-treasury-via-gateway.ts
```

**Option 2: Manual Step-by-Step Process**
1. **Deposit on Sepolia (Creates Unified Balance):**
   - Approve Gateway Wallet: `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`
   - Call `deposit(token, amount)` on Gateway Wallet contract
   - This creates a unified USDC balance accessible from any supported chain
   - Wait for finality (~12-15 minutes, ~32 blocks)

2. **Create and Sign BurnIntent:**
   - Create a BurnIntent with EIP-712 typed data containing:
     - `sourceDomain: 0` (Sepolia)
     - `destinationDomain: 26` (Arc Testnet)
     - Transfer amount and recipient details
   - Sign the BurnIntent with your private key

3. **Submit to Gateway API:**
   - POST signed BurnIntent to: `https://gateway-api-testnet.circle.com/v1/transfer`
   - Receive attestation and signature in response

4. **Mint on Arc:**
   - Call `gatewayMint(attestation, signature)` on Gateway Minter: `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B`
   - USDC becomes available on Arc in <500ms

5. **Deposit to Treasury:**
   - Approve TreasuryVault contract
   - Call `depositToTreasury(amount)` on TreasuryVault
   - Treasury is now funded and ready for pot creation

### Creating a Department Pot

1. Connect wallet to frontend (MetaMask/WalletConnect)
2. Ensure treasury has USDC balance
3. Navigate to Dashboard → "Create Pot"
4. Specify: pot ID, budget, approvers (addresses), threshold (# approvals needed)
5. Sign transaction and wait for confirmation

### Executing a Payment

**Single Payment:**
1. Go to Dashboard → Select pot → "New Payment"
2. Recipient must be whitelisted (add via "Manage Beneficiaries")
3. Enter amount and recipient
4. If amount < threshold: Executes immediately
5. If amount ≥ threshold: Queued for approvals

**Multi-Sig Approval:**
1. Navigate to Approvals page
2. Pending payments appear in queue
3. Each approver signs transaction
4. Once threshold met, payment auto-executes

## File Locations Reference

**Smart Contracts:**
- Main contract: `src/TreasuryVault.sol`
- Deploy script: `script/Deploy.s.sol`
- Build artifacts: `out/`
- Foundry config: `foundry.toml`

**Backend:**
- Entry point: `backend/src/app.ts`
- Circle service: `backend/src/services/circle.service.ts`
- Bridge service: `backend/src/services/bridgeKit.service.ts`
- Routes: `backend/src/routes/circle.routes.ts`

**Frontend:**
- Entry point: `frontend/src/main.tsx`
- App component: `frontend/src/App.tsx`
- Components: `frontend/src/components/`
- Pages: `frontend/src/pages/`
- Library code: `frontend/src/lib/`
- UI primitives: `frontend/src/components/ui/` (shadcn/ui)

**Configuration:**
- Frontend config: `frontend/vite.config.ts`, `frontend/tailwind.config.ts`
- TypeScript config: `frontend/tsconfig.json`
- Package manifests: `package.json` (root, frontend, backend each have their own)

## Current State & Roadmap

**Implemented (Tier 1):**
- Unified treasury with USDC deposits
- Departmental pot creation with budget enforcement
- Single and batch payment execution
- Multi-signature approval workflows
- Budget reallocation between pots
- Beneficiary whitelisting
- Audit trail via events
- Circle Gateway integration for cross-chain USDC transfers (Sepolia → Arc)

**Roadmap:**
- Complete Circle Gateway API integration (attestation fetching + minting)
- Support for additional source chains (Base, Arbitrum, Polygon via Gateway)
- Scheduled/recurring payment flows (Chainlink Automation)
- Privacy features using Arc's configurable privacy
- Circle Yield integration for treasury optimization
- Advanced analytics dashboard

## Important Notes

- **Circle Gateway vs CCTP**: Circle Gateway is different from CCTP (Cross-Chain Transfer Protocol):
  - **Gateway**: Uses unified USDC balance + burn intents. Instant transfers after initial deposit finality.
  - **CCTP**: Direct burn-and-mint between chains. Uses `receiveMessage()` and attestation service at `iris-api.circle.com`.
  - This project uses **Gateway**, NOT CCTP.
- **Gateway Workflow**: Deposit → Create unified balance → Sign burn intent → API call → Mint on destination
- **Gateway Contract Methods**:
  - Wallet: `deposit(token, amount)` - Creates unified balance
  - Minter: `gatewayMint(attestation, signature)` - Mints from unified balance
- **Gateway API**: `https://gateway-api-testnet.circle.com/v1/transfer` (POST, no API key required)
- **Domain IDs**: Sepolia = 0, Arc Testnet = 26
- **Gas Token**: Arc uses USDC for gas, not ETH. Ensure deployment wallet has USDC from faucet.
- **USDC Decimals**: Arc USDC uses 6 decimals (not 18). Always handle amounts accordingly.
- **Multi-Sig**: Approval threshold is number of signatures required (e.g., 2/3 means 2 out of 3 approvers).
- **Budget Enforcement**: Smart contract prevents overspending mathematically - no way to bypass.
- **Whitelist**: Payments can only go to pre-approved beneficiary addresses per pot.
- **Foundry Legacy Flag**: Use `--legacy` flag when deploying to Arc to ensure EIP-1559 compatibility.
- **Gateway Finality**: Sepolia requires ~12-15 minutes (~32 blocks) for finality before USDC appears in unified balance.
- **Direct Transfer Warning**: Directly transferring USDC to Gateway Wallet with standard ERC-20 transfer will result in loss of funds. Always use the `deposit()` method.
