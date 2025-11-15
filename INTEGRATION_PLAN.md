# Knight-C Frontend-Backend Integration Plan
**Hybrid Architecture: Circle Gateway REST API + Arc Smart Contract Web3**

**Status:** 🟢 In Progress (53% Complete - 10/19 Tasks)
**Last Updated:** 2025-01-15

---

## 📋 Executive Summary

Knight-C is being integrated as a **hybrid system** combining:
- **Circle Gateway REST API** (Backend) - Handles fiat ↔ USDC conversion via Circle's BridgeKit
- **TreasuryVault Smart Contract** (Arc Blockchain) - Handles budget enforcement, payments, and approvals
- **React Frontend** - Connects to both systems via REST API (axios) and Web3 (wagmi/viem)

### Architecture Flow
```
CFO Deposits Fiat ($1M)
    ↓
Circle Gateway REST API (POST /api/circle/deposit)
    ↓
Circle mints USDC → Sends directly to TreasuryVault.sol on Arc
    ↓
Frontend reads contract via Web3 (wagmi hooks)
    ↓
CFO creates department budgets (pots) via Web3 writes
    ↓
Contract enforces budgets, executes payments, handles approvals
```

---

## ✅ Completed Work (10 Tasks)

### **Phase 1: Backend API Client Setup** ✅ COMPLETE
**Duration:** ~1.5 hours | **Files:** 3 new

#### 1.1 REST API Client (`frontend/src/lib/api.ts`)
- **7 Circle Gateway Endpoints Implemented:**
  - `getCircleBalance()` - Get Circle wallet balance
  - `depositFiat(amount, currency, destinationType)` - Deposit fiat → USDC
    - **Key Feature:** `destinationType: "contract"` sends USDC directly to TreasuryVault
  - `withdrawToFiat(amount, bankAccountId, source)` - Withdraw USDC → fiat
  - `transferToArc(amount)` - Transfer USDC to Arc contract (optional if using wallet intermediary)
  - `getTransferStatus(transferId)` - Poll transfer status
  - `crossChainTransfer(amount, chain, address)` - CCTP cross-chain transfers
  - `getTreasuryBalance()` - Get on-chain contract balance

- **Helper Functions:**
  - `pollTransferStatus()` - Auto-poll until transfer completes (2s interval, 60 attempts max)
  - `isApiError()` - Type guard for error responses

- **Features:**
  - Axios interceptors for request/response logging
  - Type-safe with full TypeScript coverage
  - Configurable base URL via `VITE_API_BASE_URL`

#### 1.2 API TypeScript Types (`frontend/src/types/api.types.ts`)
- **Comprehensive Type Coverage:**
  - Request types: `DepositRequest`, `WithdrawRequest`, `CrossChainTransferRequest`, etc.
  - Response types: `CircleBalanceResponse`, `DepositResponse`, `TransferStatusResponse`, etc.
  - Status enums: `TransferStatus`, `DestinationType`, `SourceType`, `Currency`
  - Generic response wrapper: `ApiResponse<T>` with success/error discrimination

#### 1.3 Environment Variables (`frontend/.env`)
```env
# Backend API
VITE_API_BASE_URL=http://localhost:3000

# Arc Network
VITE_TREASURY_ADDRESS=0x0000000000000000000000000000000000000000  # Placeholder
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_CHAIN_ID=5042002

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=
```

---

### **Phase 2: Web3 Infrastructure Setup** ✅ COMPLETE
**Duration:** ~1.5 hours | **Files:** 2 new, 2 modified

#### 2.1 Wagmi Configuration (`frontend/src/lib/wagmi.ts`)
- **Arc Testnet Chain Definition:**
  - Chain ID: `5042002`
  - Native Currency: USDC (6 decimals for display)
  - RPC: `https://rpc.testnet.arc.network`
  - WebSocket: `wss://rpc.testnet.arc.network`
  - Explorer: `https://testnet.arcscan.app`

- **Wallet Connectors (4 configured):**
  - MetaMask (with dApp metadata)
  - WalletConnect (with project ID and QR modal)
  - Coinbase Wallet (with app branding)
  - Injected (fallback for other wallets)

- **Treasury Contract Export:**
  - Pre-configured contract object with address, ABI, chainId
  - Helper functions: `isCorrectNetwork()`, `getNetworkName()`

#### 2.2 App.tsx Integration
- **Added WagmiProvider:**
  - Wrapped entire app with `<WagmiProvider config={config}>`
  - Maintains existing QueryClientProvider structure
  - All child components now have access to wagmi hooks

#### 2.3 WalletConnect Component (`frontend/src/components/WalletConnect.tsx`)
- **Real Wallet Integration:**
  - `useAccount()` - Get connection status, address, chain
  - `useConnect()` - Connect to selected wallet
  - `useDisconnect()` - Disconnect wallet

- **Features:**
  - Modal with all available wallet connectors
  - Network detection with "Wrong Network" indicator
  - Arc Testnet chain ID display in modal
  - Truncated address display when connected
  - Wallet icons mapped by connector type

---

### **Phase 8: Helper Utilities** ✅ COMPLETE
**Duration:** ~1 hour | **Files:** 2 new

#### 8.1 Constants (`frontend/src/lib/constants.ts`)
```typescript
// Arc Network
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_EXPLORER_URL = "https://testnet.arcscan.app";
export const USDC_DECIMALS = 6;  // Critical: ERC20 interface uses 6 decimals

// Pot Configuration
export const POT_IDS = ["engineering", "marketing", "operations"];
export const POT_NAMES = { engineering: "Engineering", ... };
export const POT_COLORS = { engineering: "bg-blue-500", ... };
export const POT_ICONS = { engineering: "⚙️", ... };

// Thresholds
export const DEFAULT_APPROVAL_THRESHOLD = 50000; // $50K

// Polling
export const POLLING_INTERVAL = 2000;  // 2 seconds
export const MAX_POLLING_ATTEMPTS = 60; // 2 minutes
```

#### 8.2 Utility Functions (`frontend/src/lib/utils.ts`)
**Web3 Utilities:**
- `stringToBytes32(str)` - Convert pot IDs to bytes32 for contract calls
- `parseUSDC(amount)` - Parse amount to 6 decimal format (Arc best practice)
- `formatUSDC(amount, includeSymbol)` - Format bigint to "$1,000.50"

**Address & Hash Utilities:**
- `truncateAddress(address)` - "0x1234...cdef"
- `truncateTxHash(hash)` - "0x12345678...abcdef90"
- `getExplorerTxUrl(txHash)` - Full Arc Explorer transaction link
- `getExplorerAddressUrl(address)` - Full Arc Explorer address link

**Validation & Formatting:**
- `isValidAddress(address)` - Regex validation
- `isValidAmount(amount)` - Positive number check
- `formatNumber(num)` - Add commas
- `formatPercentage(value, decimals)` - "75.00%"
- `formatDate(isoString)` - "Jan 15, 2025 10:30 AM"
- `getRelativeTime(isoString)` - "2 minutes ago"

---

### **Phase 3: Dashboard Hybrid Integration** ✅ COMPLETE (2/3)
**Duration:** ~2.5 hours | **Files:** 1 new, 1 modified

#### 3.1 TreasuryFunding Component (`frontend/src/components/TreasuryFunding.tsx`)
**Purpose:** CFO deposits fiat → USDC directly to TreasuryVault contract

**Features:**
- **Current Balance Display:**
  - Fetches via `GET /api/circle/treasury-balance`
  - Shows on-chain contract USDC balance
  - Link to Arc Explorer for contract address
  - Auto-refresh after successful deposit

- **Deposit Form:**
  - Input field for USD amount
  - Calls `POST /api/circle/deposit` with `destinationType: "contract"`
  - Real-time transfer status with polling
  - Visual status indicators (pending/complete/failed)
  - Transfer ID display for tracking

- **User Experience:**
  - Loading states with spinners
  - Toast notifications for success/failure
  - Info notice explaining direct-to-contract flow
  - Gradient blue card design for visibility

**API Integration:**
```typescript
// Deposit flow
const response = await depositFiat(amount, "USD", "contract");
const { transferId } = response.data;

// Poll until complete
const statusResponse = await pollTransferStatus(transferId);

// Refresh balance
await fetchTreasuryBalance();
```

#### 3.2 Dashboard Page (`frontend/src/pages/Dashboard.tsx`)
**Replaced Mock Data with Real Contract Reads:**

**Before (Mocked):**
```typescript
const POTS = [
  { id: "engineering", budget: 2000000, spent: 1200000 },
  // ... hardcoded values
];
const totalTreasury = 10000000;
```

**After (Web3):**
```typescript
// Read all pot details from contract
const { data: potsData } = useReadContracts({
  contracts: POT_IDS.map((potId) => ({
    ...treasuryContract,
    functionName: "getPotDetails",
    args: [stringToBytes32(potId)],
  })),
});

// Read contract USDC balance
const { data: balanceData } = useBalance({
  address: treasuryVaultAddress,
});

// Transform contract data
const pots: Pot[] = POT_IDS.map((potId, index) => {
  const [budget, spent, threshold] = potsData[index].result;
  return { id: potId, name: POT_NAMES[potId], budget, spent };
});
```

**Features:**
- **Hybrid Architecture:**
  - Top section: TreasuryFunding (REST API for fiat deposits)
  - Middle section: Treasury balance (Web3 read from contract)
  - Bottom section: Pot budget cards (Web3 batch reads)

- **Loading States:**
  - Skeleton loaders for balance
  - Spinner for pot data
  - "Loading pot budgets from contract..." message

- **Data Display:**
  - All amounts formatted with `formatUSDC()` (6 decimal precision)
  - Progress bars showing budget utilization
  - Available = budget - spent calculation
  - Color-coded pot indicators

**Arc Best Practices Applied:**
- ✅ USDC 6 decimals (ERC20 interface)
- ✅ Batch contract reads for efficiency
- ✅ stringToBytes32 for pot ID conversion
- ✅ formatUnits/parseUnits with 6 decimal precision

---

## 📦 File Inventory

### **New Files Created (9 total)**
1. `frontend/src/lib/api.ts` - REST API client (240 lines)
2. `frontend/src/types/api.types.ts` - API TypeScript types (70 lines)
3. `frontend/src/lib/wagmi.ts` - Wagmi configuration (90 lines)
4. `frontend/src/lib/constants.ts` - Application constants (60 lines)
5. `frontend/src/components/TreasuryFunding.tsx` - Fiat deposit UI (200 lines)
6. `frontend/.env` - Environment variables (7 lines)
7. `INTEGRATION_PLAN.md` - This document

### **Files Modified (4 total)**
1. `frontend/src/App.tsx` - Added WagmiProvider wrapper
2. `frontend/src/components/WalletConnect.tsx` - Real wagmi hooks
3. `frontend/src/lib/utils.ts` - Added Web3 utilities (170 lines added)
4. `frontend/src/pages/Dashboard.tsx` - Hybrid REST + Web3 integration

### **Dependencies Installed**
- `axios` (REST API client)

---

## 🚧 Remaining Work (9 Tasks - 47%)

### **Phase 3: Dashboard - Remaining** (1 task)
- [ ] **Create CreatePotModal component**
  - CFO creates new department budgets
  - Form: pot name, budget amount, approvers[], threshold
  - Contract write: `createPot(bytes32, uint256, address[], uint256)`
  - Validation: budget > 0, approvers array valid
  - Success: Refresh pot list

---

### **Phase 4: Payment Flows (Web3 Writes)** (2 tasks)

#### 4.1 SinglePaymentModal (`frontend/src/components/SinglePaymentModal.tsx`)
**Current:** Client-side validation with mock setTimeout

**Need to Replace:**
```typescript
// BEFORE (Mock)
setTimeout(() => {
  onSuccess();
}, 1500);

// AFTER (Web3)
const { writeContract } = useWriteContract();
const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

await writeContract({
  ...treasuryContract,
  functionName: 'submitPayment',
  args: [
    stringToBytes32(potId),
    [recipientAddress],
    [parseUSDC(amount)]
  ]
});
```

**Features to Add:**
- Contract write with `useWriteContract()` hook
- Transaction confirmation with `useWaitForTransactionReceipt()`
- Handle contract revert: "Exceeds budget" → trigger ReallocationModal
- Display transaction hash with Arc Explorer link
- Show USDC gas cost
- Auto-refresh pot balances on success

#### 4.2 BatchPaymentModal (`frontend/src/components/BatchPaymentModal.tsx`)
**Current:** CSV parsing with mock validation

**Need to Replace:**
- Same as SinglePaymentModal but with arrays
- Parse CSV to `recipients[]` and `amounts[]`
- All amounts parsed with `parseUSDC(amount)` (6 decimals)
- Batch summary before submission
- Progress indicator during transaction

---

### **Phase 5: Approval Queue (Web3 Reads/Writes)** (2 tasks)

#### 5.1 ApprovalQueue Component (`frontend/src/components/ApprovalQueue.tsx`)
**Current:** Lines 8-29 have MOCK_PENDING_PAYMENTS array

**Need to Replace:**
```typescript
// Read pending queue
const { data: queueHashes } = useReadContract({
  ...treasuryContract,
  functionName: 'pendingQueue',
});

// Batch read details for each pending payment
const { data: pendingDetails } = useReadContracts({
  contracts: queueHashes?.map(txHash => ({
    ...treasuryContract,
    functionName: 'getPendingDetails',
    args: [txHash]
  }))
});

// Filter out executed payments
const activePending = pendingDetails?.filter(p => !p.executed);
```

**Display:**
- Pot ID, recipient count, approval count / required approvals
- Empty state: "No pending approvals"

#### 5.2 Approve Payment Action
**Current:** Lines 32-45 have mock setTimeout approval

**Need to Replace:**
```typescript
const { writeContract } = useWriteContract();

await writeContract({
  ...treasuryContract,
  functionName: 'approvePayment',
  args: [txHash]
});
```

**Features:**
- Show approval progress (X/Y approvals)
- Auto-execute when threshold reached
- Refresh queue after approval
- Toast notification on success

---

### **Phase 6: Budget Reallocation (Web3 Reads/Writes)** (1 task)

#### ReallocationModal (`frontend/src/components/ReallocationModal.tsx`)
**Current:** Lines 31-35 have ALL_POTS mock, lines 55-79 have mock handleReallocate

**Need to Replace:**
```typescript
// Read all pot balances
const { data: potsData } = useReadContracts({
  contracts: POT_IDS.map(potId => ({
    ...treasuryContract,
    functionName: 'getPotDetails',
    args: [stringToBytes32(potId)]
  }))
});

// Calculate available for each pot
const availablePots = potsData.map(([budget, spent]) => ({
  available: budget - spent
}));

// Reallocate
const { writeContract } = useWriteContract();
await writeContract({
  ...treasuryContract,
  functionName: 'reallocate',
  args: [
    stringToBytes32(fromPot),
    stringToBytes32(toPot),
    parseUSDC(amount)
  ]
});
```

**Features:**
- Source pot dropdown with available balances
- Amount validation (max = source available)
- Refresh all pot balances on success
- Trigger retry of failed payment (if initiated from budget error)

---

### **Phase 7: Withdrawal Flow (REST API)** (1 task)

#### WithdrawToFiat Component (NEW)
**Purpose:** CFO withdraws USDC → fiat from contract

**Implementation:**
```typescript
// Display available contract balance
const { data: balanceData } = useBalance({ address: treasuryVaultAddress });

// Withdraw
const response = await withdrawToFiat(amount, bankAccountId, "contract");
```

**Considerations:**
- Requires backend to have withdrawal permissions from contract
- Or: CFO transfers from contract to Circle wallet first, then withdraws
- Form: amount, bank account selection
- Status tracking with polling
- Auth check: only CFO can initiate

---

### **Phase 9: Roadmap Features Labeling** (1 task)

#### ScheduledFlows Page (`frontend/src/pages/ScheduledFlows.tsx`)
- Add badge: "🚀 Roadmap Feature - Chainlink Automation"
- Add description: "Automated recurring payments coming soon"
- Keep existing mock UI for demo purposes

#### Compliance Page (`frontend/src/pages/Compliance.tsx`)
- Add badge: "🚀 Roadmap Feature - Event Analytics"
- Add description: "On-chain audit trails via event logs"
- Future: Query `PaymentExecuted` and `BudgetReallocated` events

---

### **Phase 10: UX Polish** (1 task)

#### Transaction Feedback
- Toast notifications for all operations
- Pending states with spinners
- Success messages with Arc Explorer links
- Display gas costs in USDC (not ETH)

#### Error Handling
- Contract reverts: "Insufficient budget", "Not whitelisted", etc.
- REST API errors: Network issues, Circle API failures
- Wallet errors: Rejection, insufficient USDC for gas
- Network mismatch: Prompt to switch to Arc Testnet

#### Loading States
- Skeleton loaders for all data-fetching components
- Disable buttons during pending transactions
- Show transfer status for Circle deposits/withdrawals
- Auto-refresh data after successful operations

---

## 🎯 Arc Network Best Practices (Applied Throughout)

### ✅ USDC 6 Decimals
- **All** `parseUnits()` and `formatUnits()` use 6 decimals (ERC20 interface)
- Example: `parseUnits("1000.50", 6)` → `1000500000n`
- **Critical:** Arc USDC native balance uses 18 decimals, but ERC20 interface uses 6

### ✅ USDC as Gas Token
- Display gas costs in USDC, not ETH
- wagmi config sets `nativeCurrency.symbol = "USDC"`
- Gas fees shown in transaction feedback

### ✅ Single Confirmation Sufficient
- Use `useWaitForTransactionReceipt()` without extra confirmations
- Arc provides deterministic finality in ~0.4 seconds
- No need for multi-block waiting like Ethereum

### ✅ Arc Chain Configuration
- Chain ID: 5042002
- RPC: https://rpc.testnet.arc.network
- Explorer: https://testnet.arcscan.app
- All transaction links use Arc Explorer

### ✅ Direct Contract Funding
- Recommended: `depositFiat()` with `destinationType: "contract"`
- Skips intermediate Circle wallet
- Simpler flow: Fiat → USDC → TreasuryVault (one API call)

---

## 📊 Progress Tracking

**Completed:** 10/19 tasks (53%)

| Phase | Tasks | Status | Duration |
|-------|-------|--------|----------|
| Phase 1: REST API Client | 3 | ✅ Complete | 1.5 hrs |
| Phase 2: Web3 Infrastructure | 3 | ✅ Complete | 1.5 hrs |
| Phase 8: Helper Utilities | 2 | ✅ Complete | 1 hr |
| Phase 3: Dashboard Integration | 2/3 | 🟡 In Progress | 2.5 hrs |
| Phase 4: Payment Flows | 0/2 | ⏳ Pending | ~2 hrs |
| Phase 5: Approval Queue | 0/2 | ⏳ Pending | ~1.5 hrs |
| Phase 6: Reallocation Modal | 0/1 | ⏳ Pending | ~1 hr |
| Phase 7: Withdrawal Component | 0/1 | ⏳ Pending | ~1 hr |
| Phase 9: Roadmap Badges | 0/1 | ⏳ Pending | ~30 min |
| Phase 10: UX Polish | 0/1 | ⏳ Pending | ~1.5 hrs |

**Total Estimated Remaining Time:** 7.5 hours
**Total Time Spent:** 5.5 hours
**Total Project Time:** ~13 hours (original estimate: 12-17.5 hours)

---

## 🚀 Next Steps

### Immediate Priority
1. **Create CreatePotModal** - Complete Phase 3
2. **Update Payment Modals** - Phase 4 (critical for demo)
3. **Implement Approval Queue** - Phase 5 (critical for demo)

### Medium Priority
4. **Budget Reallocation** - Phase 6
5. **Withdrawal Component** - Phase 7

### Final Polish
6. **Roadmap Badges** - Phase 9
7. **UX Enhancements** - Phase 10

---

## 📝 Testing Checklist (Post-Implementation)

### REST API Testing
- [ ] Deposit fiat → USDC to contract (sandbox/testnet)
- [ ] Check treasury balance via API
- [ ] Poll transfer status until complete
- [ ] Verify transaction on Arc Explorer

### Web3 Testing
- [ ] Connect wallet (MetaMask on Arc Testnet)
- [ ] Create pot (budget allocation)
- [ ] Submit payment under threshold (auto-execute)
- [ ] Submit payment over threshold (requires approval)
- [ ] Approve pending payment
- [ ] Attempt payment exceeding budget (should revert)
- [ ] Reallocate budget between pots
- [ ] Verify all transactions on Arc Explorer
- [ ] Check USDC gas fees displayed correctly

---

## 🏁 Deployment Prerequisites

### Backend
- [ ] Circle API keys configured
- [ ] Circle wallet IDs set up
- [ ] Treasury contract address configured in backend `.env`

### Smart Contract
- [ ] Deploy TreasuryVault.sol to Arc Testnet
- [ ] Save deployed address
- [ ] Verify contract on ArcScan (optional)

### Frontend
- [ ] Update `VITE_TREASURY_ADDRESS` in `.env`
- [ ] Get WalletConnect Project ID from cloud.walletconnect.com
- [ ] Configure `VITE_API_BASE_URL` for backend
- [ ] Test wallet connection on Arc Testnet

### Full E2E Test
- [ ] Deposit fiat → USDC to contract
- [ ] Create department budgets (pots)
- [ ] Submit payment (under threshold)
- [ ] Submit payment (over threshold, multi-sig)
- [ ] Approve pending payment
- [ ] Reallocate budget
- [ ] Verify all data on Arc Explorer

---

## 📚 Documentation References

- **Arc Network Docs:** https://code.claude.com/docs (already reviewed)
- **Circle Gateway:** https://developers.circle.com/gateway
- **Circle CCTP:** https://developers.circle.com/cctp
- **wagmi Docs:** https://wagmi.sh
- **viem Docs:** https://viem.sh

---

**Last Updated:** 2025-01-15 | **Next Review:** After Phase 4 completion
