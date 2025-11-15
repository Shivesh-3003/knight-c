# Knight-C Deployment Guide

This guide walks you through deploying the TreasuryVault contract and setting up the complete Knight-C environment.

## Prerequisites

- Node.js v18+ installed
- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- MetaMask or another Web3 wallet
- Arc Testnet USDC for gas (get from https://faucet.circle.com)

## Step 1: Get Testnet USDC for Gas

Arc Network uses USDC as the gas token (not ETH).

1. Visit https://faucet.circle.com
2. Select "Arc Testnet"
3. Enter your wallet address
4. Request testnet USDC (~1000 USDC should be enough)
5. Wait for confirmation

## Step 2: Deploy TreasuryVault Contract

### 2.1 Configure Environment

Create or edit `.env` in the project root:

```bash
# Your wallet private key (the one with testnet USDC)
PRIVATE_KEY=your_private_key_here

# Arc Testnet RPC
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

# USDC address on Arc Testnet
USDC_ADDRESS=0x3600000000000000000000000000000000000000
```

**⚠️ IMPORTANT:** Never commit your actual `.env` file to git! Use `.env.example` for templates.

### 2.2 Deploy Contract

From the project root directory:

```bash
# Compile contracts
forge build

# Deploy to Arc Testnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --broadcast \
  --legacy

# The output will show your deployed contract address
# Example: Deployed TreasuryVault at 0x1aBEb3Ac46D9681A6cca2534bf8be8d2C07dA7B3
```

**Note:** The `--legacy` flag is important for Arc Network compatibility.

### 2.3 Save the Deployed Address

Copy the deployed contract address from the output and save it - you'll need it in the next step.

## Step 3: Configure Frontend Environment

Edit `frontend/.env`:

```bash
# CRITICAL: Update this with your deployed contract address
VITE_TREASURY_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE

# Arc Network Configuration
VITE_USDC_ADDRESS=0x3600000000000000000000000000000000000000
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_CHAIN_ID=5042002

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Backend API URL
VITE_API_BASE_URL=http://localhost:3000
```

## Step 4: Configure Backend Environment

Create `backend/.env`:

```bash
# Circle API Configuration
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_circle_entity_secret

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:8082

# Arc Network
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
VITE_TREASURY_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS_HERE
```

**To get Circle API credentials:**
1. Visit https://developers.circle.com
2. Sign up for a developer account
3. Create a new API key
4. Save both the API key and entity secret

## Step 5: Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
npm install
```

### Root (if needed)

```bash
npm install
```

## Step 6: Start the Application

### Terminal 1: Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Knight-C Backend Server
📡 Listening on http://localhost:3000
🏥 Health check: http://localhost:3000/health
💰 Circle API routes: http://localhost:3000/api/circle
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8082/
```

## Step 7: Verify Deployment

### 7.1 Check Backend Health

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T...",
  "service": "Knight-C Backend"
}
```

### 7.2 Check Contract on ArcScan

Visit: `https://testnet.arcscan.app/address/YOUR_CONTRACT_ADDRESS`

You should see:
- Contract created successfully
- Balance: 0 USDC (initially)
- Transactions: Deployment transaction

### 7.3 Test Frontend

1. Open http://localhost:8082
2. Open browser DevTools Console (F12)
3. Look for logs:
   ```
   [WalletConnect] Connectors status: [...]
   [Dashboard] Treasury address: 0x...
   ```
4. Click "Connect Wallet"
5. All wallet options should now be **clickable** (no "not installed")
6. Select your wallet and connect

## Step 8: Fund the Treasury

Now that the contract is deployed, you can send USDC to it.

### Option A: Direct Transfer (Simple)

Using MetaMask or your wallet:
1. Send USDC to the treasury contract address
2. On Arc Testnet, USDC address is: `0x3600000000000000000000000000000000000000`
3. Or just send the native balance (Arc uses USDC as native currency)

### Option B: Using Contract Function (Proper)

The TreasuryVault has a `depositToTreasury(amount)` function:

```bash
# First, approve the contract to spend your USDC
cast send 0x3600000000000000000000000000000000000000 \
  "approve(address,uint256)" \
  YOUR_TREASURY_ADDRESS \
  10000000 \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY

# Then deposit to treasury
cast send YOUR_TREASURY_ADDRESS \
  "depositToTreasury(uint256)" \
  10000000 \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY
```

Note: 10000000 = 10 USDC (USDC has 6 decimals)

## Step 9: Verify Balance on Dashboard

1. Refresh the frontend at http://localhost:8082
2. The "Total Treasury Balance" should now show your deposited amount
3. You can also click the refresh button (↻) to manually refetch

## Troubleshooting

### Issue: Wallets Still Show "Not Installed"

**Cause:** You don't actually have the wallet extension installed.

**Solution:**
- Install MetaMask: https://metamask.io
- Or use WalletConnect to connect mobile wallets
- Or use Coinbase Wallet extension

### Issue: Balance Shows $0 After Sending USDC

**Check:**
1. Did you send to the treasury contract address (not your personal wallet)?
2. Verify on ArcScan that the transaction confirmed
3. Check the contract balance on ArcScan
4. Make sure `VITE_TREASURY_ADDRESS` in frontend/.env matches your deployed address

### Issue: Backend Connection Refused

**Solution:**
1. Make sure backend is running: `cd backend && npm run dev`
2. Check it's on port 3000: `curl http://localhost:3000/health`
3. Verify `VITE_API_BASE_URL` in frontend/.env is `http://localhost:3000`

### Issue: Transaction Fails with "Insufficient Funds"

**Cause:** Not enough USDC for gas on Arc Network.

**Solution:**
1. Get more testnet USDC from https://faucet.circle.com
2. Remember: Arc uses USDC for gas, not ETH

### Issue: Wrong Network in Wallet

**Solution:**
1. Add Arc Testnet to your wallet manually:
   - Network Name: Arc Testnet
   - RPC URL: https://rpc.testnet.arc.network
   - Chain ID: 5042002
   - Currency Symbol: USDC
   - Block Explorer: https://testnet.arcscan.app

## Next Steps

Once deployed and funded:

1. **Create Department Pots**
   - Click "Create New Pot" on dashboard
   - Set budget, approvers, and threshold

2. **Add Beneficiaries**
   - Whitelist addresses that can receive payments

3. **Make Payments**
   - Single payments or batch payroll
   - Test multi-sig approvals

4. **Test Reallocation**
   - Move budget between departments

## Production Deployment

For production deployment to Arc Mainnet:

1. Update `.env` with mainnet RPC URL
2. Use a secure private key management solution (not `.env` file)
3. Get real USDC from Circle
4. Deploy with `--verify` flag to verify contract on explorer
5. Set up proper backend hosting (not localhost)
6. Configure production frontend URL
7. Enable proper CORS and security headers
8. Set up monitoring and alerting

## Support

- Arc Network Docs: https://docs.arc.network
- Circle Docs: https://developers.circle.com
- Foundry Book: https://book.getfoundry.sh
- Issues: https://github.com/your-repo/knight-c/issues
