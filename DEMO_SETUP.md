# Demo Setup Guide

This guide provides step-by-step instructions to deploy and configure Knight-C for the Act 3 & Act 4 demo.

## Summary of Changes

### Contract Updates
- ✅ Added `updatePot()` function to allow CFO to modify pot budgets and thresholds
- ✅ Updated Setup script to create pots with CFO-only approvals (1 approval required)

### Frontend Updates
- ✅ Removed mock data from Dashboard - now uses real on-chain pot data
- ✅ Added `threshold` field to pot interface
- ✅ Fixed payment modals to use actual pot threshold instead of hardcoded $50,000
- ✅ Created Beneficiary Management UI (pre-populated with CFO, VP, Employee)
- ✅ Created Edit Pot UI (update budget and threshold)
- ✅ Fixed Approval Queue to show "1 of 1" approvals for demo

## Deployment Steps

### Step 1: Deploy Updated Contract

```bash
# Make sure you have USDC for gas on Arc Testnet
# Get it from: https://faucet.circle.com

# Deploy the TreasuryVault contract
forge script script/Deploy.s.sol:Deploy --rpc-url $ARC_TESTNET_RPC_URL --broadcast --legacy

# Note the deployed contract address
# Update frontend/.env with: VITE_TREASURY_ADDRESS=<new_address>
```

### Step 2: Create Pots with Initial Configuration

```bash
# Update script/Setup.s.sol line 17 with your new contract address
# Then run:
forge script script/Setup.s.sol:Setup --rpc-url $ARC_TESTNET_RPC_URL --broadcast --legacy
```

This creates:
- **Engineering**: $3 budget, $0.50 approval threshold
- **Marketing**: $5 budget, $0.50 approval threshold
- **Operations**: $2 budget, $0.50 approval threshold
- **Approvers**: CFO only (1 approval required)
- **Whitelisted**: CFO, VP, Employee addresses

### Step 3: Update Engineering Pot for Demo

As CFO, use the frontend to update Engineering pot:

1. Navigate to Dashboard
2. Click the edit icon (top-right) on Engineering pot card
3. Update:
   - Budget: $8
   - Threshold: $5
4. Submit transaction

### Step 4: Fund the Treasury

Fund the treasury with $9 USDC using one of these methods:

**Option A: Using the Frontend (Recommended)**
1. As CFO, go to Dashboard
2. Use the "Treasury Funding" section
3. Deposit $9 USDC

**Option B: Using Cast**
```bash
# Approve TreasuryVault to spend your USDC
cast send 0x3600000000000000000000000000000000000000 \
  "approve(address,uint256)" \
  <TREASURY_ADDRESS> \
  9000000 \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key $PRIVATE_KEY \
  --legacy

# Deposit to treasury
cast send <TREASURY_ADDRESS> \
  "depositToTreasury(uint256)" \
  9000000 \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key $PRIVATE_KEY \
  --legacy
```

## Demo Flow Verification

### Act 3: Automated Payroll (Multi-Sig Approval)

**As VP:**
1. Navigate to Dashboard → Engineering pot
2. Click "Make Payment" or "Batch Payment (Payroll)"
3. Enter amount >= $5 (e.g., $6)
4. Submit payment
5. ✅ Should see: "Payment Pending Approval" toast
6. ✅ Payment should NOT execute immediately

**As CFO:**
1. Navigate to Approvals page
2. ✅ Should see: Pending payment from Engineering pot
3. ✅ Should show: "1 / 1 approvals"
4. Click "Approve Payment"
5. ✅ Payment should execute after approval

### Act 4: Budget Enforcement → Reallocation

**Setup:**
- Engineering: $1 spent / $8 budget → $7 available ✅
- Marketing: $4 spent / $5 budget → $1 available ✅
- Operations: $2 spent / $2 budget → $0 available ❌ (fully spent)

**As VP (or CFO):**
1. Try to make a payment from Operations pot (any amount)
2. ✅ Should see: "Budget Exceeded" error
3. ✅ ReallocationModal should open automatically
4. ✅ Modal shows real-time pot balances (Engineering: $7 available)
5. Transfer funds from Engineering → Operations
6. ✅ Payment can now proceed

## Current Configuration

### Contract Address
- TreasuryVault: Check `frontend/.env` → `VITE_TREASURY_ADDRESS`

### Role Addresses
- CFO: `0x8a7E77cB7d380AE79C2aC8c9928Ecfe06eE840AB`
- VP: `0xe88F1F5B506d4E0122869C888FcB481FCF2476ce`
- Employee: `0x5e2787391ecA7099E3eB30DEc7679f1C39D24aC8`

### Expected Final State
- **Treasury Balance**: $9
- **Engineering**: $8 budget, $1 spent, $5 threshold
- **Marketing**: $5 budget, $4 spent, $0.50 threshold
- **Operations**: $2 budget, $2 spent, $0.50 threshold

## Troubleshooting

### Payment Fails with "Not whitelisted"
- Use the "Manage Beneficiaries" button on each pot card
- Add the recipient address to the whitelist
- Only CFO can manage beneficiaries

### Payment Doesn't Trigger Approval Queue
- Check that payment amount > pot's threshold
- Engineering threshold should be $5 for demo
- Use Edit Pot UI to verify/update threshold

### Spending Values Don't Update on Refresh
- This was fixed by removing mock data
- Dashboard now reads real on-chain values
- If still seeing issues, check browser cache

### "Pot does not exist" Error
- Make sure Setup script has been run
- Verify pot IDs match: "engineering", "marketing", "operations"
- Check contract address in frontend/.env

## Notes

- All transactions require USDC for gas (not ETH) on Arc Network
- Sub-second finality means transactions confirm in <1 second
- The approval queue page is normally empty when there are no pending approvals
- Payments <= threshold execute immediately, payments > threshold require approval
