# Testing Guide: Circle Gateway Multi-Chain Integration

Complete guide to test the end-to-end Circle Gateway integration with frontend UI.

## 🎯 What We Built

A complete multi-chain Circle Gateway integration with:

✅ **Backend**: Full API with burn intent creation, EIP-712 signing, Gateway API submission, and treasury deposits
✅ **Frontend**: Beautiful two-step UI for multi-chain treasury funding
✅ **5+ Chains**: Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Polygon Amoy, Avalanche Fuji → Arc Testnet

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### 2. Configure Environment

Make sure your `.env` files are set up:

**Backend `.env`:**
```bash
PRIVATE_KEY=0x...  # Your wallet private key
TREASURY_CONTRACT_ADDRESS=0x4094b8392d2Ca5A72185C341b6bbDcBA2f8404a4
PORT=3000

# Gateway contracts (already configured)
GATEWAY_WALLET_ADDRESS=0x0077777d7EBA4688BDeF3E311b846F25870A19B9
GATEWAY_MINTER_ADDRESS=0x0022222ABE238Cc2C7Bb1f21003F0a260052475B
```

**Frontend `.env`:**
```bash
VITE_TREASURY_ADDRESS=0x4094b8392d2Ca5A72185C341b6bbDcBA2f8404a4
VITE_USDC_ADDRESS=0x3600000000000000000000000000000000000000
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_CHAIN_ID=5042002
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Start Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (or similar).

## 📝 Testing Workflow

### Option A: Test with UI (Recommended)

This is the full user experience with the beautiful multi-chain interface.

#### Step 1: Get Testnet Tokens

**For Base Sepolia (Recommended):**

1. **USDC**: Visit https://faucet.circle.com
   - Select "Base Sepolia"
   - Enter your wallet address
   - Get ~10 USDC

2. **ETH for gas**: Visit https://www.alchemy.com/faucets/base-sepolia
   - Enter your wallet address
   - Get ~0.05 ETH

#### Step 2: Access the Funding Page

1. Open http://localhost:5173 in your browser
2. Connect your wallet (MetaMask)
3. Click "**Fund Treasury**" in the sidebar (with wallet icon)

#### Step 3: Build Unified Balance (First Time)

On the Funding page:

1. **Check Chain Status** - You'll see 5 chain cards at the top:
   ```
   [Ethereum] [Base] [Arbitrum] [Polygon] [Avalanche]
   ❌ Not      ❌ Not  ❌ Not      ❌ Not      ❌ Not
   ```

2. **Select Base Sepolia** from the dropdown

3. **Enter Amount**: 5 USDC (you need 7+ total: 5 for transfer + 2 for fee)

4. **Click "Deposit to Gateway"**
   - MetaMask will prompt to switch to Base Sepolia
   - Approve transaction (USDC approval)
   - Confirm deposit transaction

5. **Status Updates**:
   ```
   [Base]
   🔄 Depositing...
   ↓
   ⏳ Waiting for finality (5/32 blocks)
   ↓
   ⏳ Waiting for finality (15/32 blocks)
   ↓
   ✅ Ready
   ```

6. **You can close the page!** 🎉
   - Progress is saved to localStorage
   - Come back in ~15 minutes

7. **After ~15 minutes**:
   - Browser notification: "✅ Deposit Finalized!"
   - Base chain shows "✅ Ready"
   - Unified Balance updates: "5.00 USDC"

#### Step 4: Instant Treasury Funding

Now the magic happens - instant transfers!

1. **Check Unified Balance**: Should show "5.00 USDC"

2. **Enter Transfer Amount**: 5 USDC

3. **Click "Transfer to Arc Treasury (Instant!)"**
   - Backend creates burn intent
   - Signs with EIP-712
   - Submits to Gateway API
   - Mints on Arc
   - Deposits to treasury
   - **All in <500ms!** ⚡

4. **Success!**
   - Toast notification: "✅ Treasury Funded!"
   - Links to transaction on Arc explorer

#### Step 5: Verify Treasury Balance

Check that the treasury received the funds:

```bash
# In a terminal
npx tsx backend/check-treasury.ts
```

Expected output:
```
✅ Treasury USDC Balance: 12.000000 USDC  # (7 previous + 5 new)
```

### Option B: Test with CLI (Backend Only)

If you want to test the backend without the UI:

```bash
# 1. Check your Base balance first
ts-node scripts/check-base-balance.ts

# 2. Fund treasury from Base Sepolia
SOURCE_CHAIN=base ts-node scripts/fund-treasury-via-gateway.ts

# 3. Verify treasury balance
npx tsx backend/check-treasury.ts
```

### Option C: Test API Endpoints Directly

Test the backend API with curl:

```bash
# 1. Check Base Sepolia balance
curl http://localhost:3000/api/circle/balance/base/YOUR_WALLET_ADDRESS

# 2. Check Gateway unified balance
curl http://localhost:3000/api/circle/balance/gateway/YOUR_WALLET_ADDRESS

# 3. Transfer to treasury (after you have unified balance)
curl -X POST http://localhost:3000/api/circle/transfer-to-treasury \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "5",
    "recipientAddress": "YOUR_WALLET_ADDRESS"
  }'

# 4. Check treasury balance
curl http://localhost:3000/api/circle/treasury-balance
```

## 🔍 What to Look For

### UI Features to Test

1. **Chain Status Tracking**
   - ❌ Red X = Not funded
   - ⏳ Yellow clock = Waiting for finality
   - ✅ Green check = Ready to use

2. **Progress Indicators**
   - Shows "5/32 confirmations"
   - Updates every 30 seconds
   - Persists across page reloads

3. **Wallet Switching**
   - Automatically prompts to switch chains
   - Works with MetaMask/WalletConnect

4. **Error Handling**
   - "Insufficient USDC balance"
   - "Need gas tokens"
   - Links to faucets

5. **Instant Transfer**
   - Second transfer should be <500ms
   - No finality wait

### Backend Console Output

When you click "Transfer to Arc Treasury", you should see in backend console:

```
Starting instant transfer: 5 USDC to treasury

=== Starting Gateway Transfer: 5 USDC ===
Step 1/4: Creating and signing burn intent...
Step 2/4: Submitting to Gateway API...
Submitting burn intent to Gateway API...
Received attestation from Gateway API
Step 3/4: Minting USDC on Arc...
Minting USDC on Arc via Gateway...
Mint confirmed: 0x...
Step 4/4: Depositing to Treasury...
Approving TreasuryVault to spend USDC...
Approval confirmed: 0x...
Depositing to TreasuryVault...
Treasury deposit confirmed: 0x...
=== Transfer Complete! ===
```

### Expected Behavior

| Action | Expected Result | Time |
|--------|----------------|------|
| First deposit from Base | Creates unified balance | ~15 min |
| Subsequent transfers | Instant from unified balance | <500ms |
| Page refresh during finality | State preserved, monitoring continues | N/A |
| Deposit from 2nd chain (e.g., Arbitrum) | Adds to unified balance | ~15 min first time |
| Transfer after multi-chain deposits | Works from combined balance | <500ms |

## 🎨 UI Screenshots (What You'll See)

### Funding Page Header
```
╔════════════════════════════════════════════╗
║  Fund Treasury                             ║
║  Transfer USDC from multiple chains...     ║
╚════════════════════════════════════════════╝

[Multi-Chain] [Instant] [Unified Balance]
  Support   Transfers    Feature
```

### Step 1: Build Unified Balance
```
┌──────────────────────────────────────────┐
│ Step 1: Build Unified Balance            │
│                                          │
│ [Ethereum] [Base] [Arbitrum] [Polygon]  │
│ ❌ Not     ✅ Ready ❌ Not     ❌ Not    │
│                                          │
│ Chain: [Base Sepolia ▼]                 │
│ Amount: [5] USDC                         │
│                                          │
│ [Deposit to Gateway]                     │
└──────────────────────────────────────────┘
```

### Step 2: Instant Transfer
```
┌──────────────────────────────────────────┐
│ Step 2: Fund Treasury → Instant          │
│                                          │
│ Unified Balance: 5.00 USDC              │
│                                          │
│ Amount: [5] USDC                         │
│                                          │
│ [Transfer to Arc Treasury (Instant!)]    │
└──────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Issue: "Insufficient balance for depositor"

**Problem**: Not enough USDC in unified balance.

**Solution**:
- You need: transfer amount + 2.01 USDC for fees
- To transfer 5 USDC, you need 7.01 USDC total
- Get more from https://faucet.circle.com

### Issue: "Private key not configured"

**Problem**: Backend `.env` missing `PRIVATE_KEY`.

**Solution**:
```bash
# Add to backend/.env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### Issue: "Transfer-to-treasury endpoint not found"

**Problem**: Frontend calling wrong API URL.

**Solution**:
```bash
# In frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```

### Issue: Chain status shows "Error"

**Problem**: Transaction failed (rejected, insufficient gas, etc.).

**Solution**:
- Check wallet has enough gas tokens
- Try again with a new transaction
- Clear localStorage and start fresh

### Issue: "Waiting for finality" stuck at same number

**Problem**: Block explorer might be down or RPC issues.

**Solution**:
- Wait a bit longer (sometimes RPC is slow)
- Check https://sepolia.basescan.org to see if blocks are progressing
- Refresh the page (state will reload from localStorage)

## 📊 Success Criteria

✅ **Backend Works**:
- Can create burn intents
- Can sign with EIP-712
- Can submit to Gateway API
- Can mint on Arc
- Can deposit to treasury

✅ **Frontend Works**:
- Wallet connects successfully
- Can switch chains
- Can deposit to Gateway
- Progress persists across reloads
- Shows finality progress
- Unified balance updates
- Instant transfer works

✅ **End-to-End Flow**:
- Deposit from Base → Wait → Transfer to Arc → Treasury funded
- Second transfer is instant (<500ms)
- Multi-chain deposits accumulate in unified balance

## 🎯 Next Steps

After successful testing:

1. **Try Other Chains**:
   - Deposit from Arbitrum Sepolia
   - Deposit from Polygon Amoy
   - Watch unified balance grow

2. **Test Multi-Chain Scenario**:
   - Deposit 5 USDC from Base
   - Deposit 3 USDC from Arbitrum
   - Transfer 8 USDC to treasury (instant!)

3. **Production Considerations**:
   - Add email/push notifications for finality
   - Add transaction history table
   - Add analytics dashboard
   - Implement retry logic for failed transfers

## 📚 Additional Resources

- **Circle Gateway Docs**: https://developers.circle.com/gateway
- **Circle Testnet Faucet**: https://faucet.circle.com
- **Arc Network Docs**: https://developers.circle.com/arc
- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Arc Testnet Explorer**: https://testnet.arcscan.app

## 🎉 You're All Set!

The complete Circle Gateway integration is ready. Enjoy instant multi-chain treasury funding! 🚀
