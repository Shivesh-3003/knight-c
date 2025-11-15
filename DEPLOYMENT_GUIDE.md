# Knight-C Deployment Guide

## 🎉 Deployment Status: COMPLETE ✅

Both the frontend and backend have been successfully deployed and are ready for testing!

---

## 📊 System Status

### Backend Server
- **Status**: ✅ Running
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Routes**: http://localhost:3000/api/circle

### Frontend Application
- **Status**: ✅ Running
- **URL**: http://localhost:8080
- **Build**: Production build completed successfully

### Smart Contract
- **Network**: Arc Testnet (Chain ID: 5042002)
- **Contract Address**: `0x1aBEb3Ac46D9681A6cca2534bf8be8d2C07dA7B3`
- **CFO Address**: `0x8a7e77cb7d380ae79c2ac8c9928ecfe06ee840ab`
- **Explorer**: https://testnet.arcscan.app/address/0x1aBEb3Ac46D9681A6cca2534bf8be8d2C07dA7B3

---

## 🔐 Role-Based Access Control Setup

The system uses wallet addresses to determine user roles and permissions:

### Role Hierarchy

#### 1. **CFO (Chief Financial Officer)**
- **Wallet Address**: `0x8a7e77cb7d380ae79c2ac8c9928ecfe06ee840ab`
- **Permissions**:
  - ✅ View treasury balance and all pots
  - ✅ Create new departmental pots
  - ✅ Approve pending payments
  - ✅ Reallocate funds between pots
  - ✅ Add/remove beneficiaries
  - ✅ Execute all payment types

#### 2. **VP (Vice President / Department Head)**
- **Wallet Address**: `0xe88f1f5b506d4e0122869c888fcb481fcf2476ce`
- **Permissions**:
  - ✅ View treasury balance and pots
  - ✅ Submit payment requests
  - ✅ Execute payments within budget
  - ❌ Cannot create pots
  - ❌ Cannot reallocate funds
  - ❌ Cannot modify beneficiaries

#### 3. **Employee**
- **Wallet Address**: `0x5e2787391eca7099e3eb30dec7679f1c39d24ac8`
- **Permissions**:
  - ✅ View treasury balance (read-only)
  - ❌ Cannot create pots
  - ❌ Cannot submit payments
  - ❌ Cannot approve payments
  - ❌ Cannot reallocate funds

---

## 🧪 Testing the Application

### Step 1: Access the Frontend

1. Open your browser and navigate to: **http://localhost:8080**
2. You should see the Knight-C Treasury Management dashboard

### Step 2: Connect Your Wallet

1. Click the **"Connect Wallet"** button in the top right
2. Choose your wallet provider (MetaMask recommended)
3. The system will automatically detect your role based on your wallet address

### Step 3: Test Role-Based Access

#### Testing as CFO

1. **Import the CFO wallet into MetaMask**:
   - Private Key: `0x37304792d55e1946f774c7b1da5bdce84f6094e3881beb365e205133b4d326dd`
   - Address: `0x8a7e77cb7d380ae79c2ac8c9928ecfe06ee840ab`

2. **Connect with this wallet**
   - You should see a **"CFO"** badge in the header
   - All buttons and actions should be enabled
   - You can create pots, approve payments, and reallocate funds

3. **Create a Departmental Pot**:
   - Click "Create Pot" button
   - Fill in:
     - Pot ID (e.g., "marketing", "engineering")
     - Budget (e.g., 500000 for $500k)
     - Approvers (comma-separated addresses)
     - Approval threshold (number of required approvals)
   - Submit the transaction

4. **Test Treasury Funding**:
   - Navigate to the Treasury Funding section
   - Deposit USDC to the contract
   - Watch the balance update in real-time

#### Testing as VP

1. **Switch to VP wallet in MetaMask**:
   - Address: `0xe88f1f5b506d4e0122869c888fcb481fcf2476ce`
   - You'll need to import this wallet with its private key (not provided for security)

2. **Connect with VP wallet**:
   - You should see a **"VP"** badge in the header
   - "Create Pot" button should be disabled with tooltip explaining why
   - "Submit Payment" button should be enabled
   - "Reallocate" button should be disabled

3. **Submit a Payment Request**:
   - Click "Submit Payment"
   - Enter recipient address and amount
   - If amount exceeds threshold, it goes to approval queue
   - If under threshold, payment executes immediately

#### Testing as Employee

1. **Switch to Employee wallet**:
   - Address: `0x5e2787391eca7099e3eb30dec7679f1c39d24ac8`

2. **Connect with Employee wallet**:
   - You should see an **"Employee"** badge
   - All action buttons should be disabled
   - You can only view data (read-only mode)
   - Hover over disabled buttons to see permission explanations

### Step 4: Test Multi-Signature Approvals

1. **As VP**: Submit a large payment (>$100k) that requires approval
2. **As CFO**: Navigate to "Approvals" page
3. **View pending payment** in the approval queue
4. **Approve the payment** with CFO signature
5. **Watch payment execute** once threshold is met

### Step 5: Test Budget Enforcement

1. **Create a pot** with limited budget (e.g., $100k)
2. **Try to submit payment** exceeding available budget
3. **Transaction should fail** with "Insufficient budget" error
4. **Test reallocation**: Move funds from another pot to cover payment
5. **Retry payment**: Should succeed after reallocation

---

## 🔄 Demo Flow (9-Minute Presentation)

Follow the **knight-c idea definition.md** for the complete demo script:

### Act 1: Setup & The Problem (1.5 min)
- Show treasury balance = $0
- Deposit USDC via Circle Gateway (mock)
- Create 3 pots: Engineering ($2M), Marketing ($500K), Operations ($750K)

### Act 2: Instant Settlement (1.5 min)
- Marketing pays $80K to São Paulo agency
- Show sub-second finality
- Show gas cost: ~1 cent

### Act 3: Automated Payroll (1 min)
- Engineering VP uploads payroll CSV (50 employees, $120K)
- Goes to approval queue (>$100K threshold)
- CFO approves
- All 50 payments execute

### Act 4: Budget Enforcement (2 min) ⭐ **HERO DEMO**
- Marketing tries to spend $450K (only $420K available)
- Transaction FAILS: ❌ INSUFFICIENT BUDGET
- CFO reallocates $30K from Operations → Marketing
- Payment now succeeds

### Act 5-7: Roadmap Features
- Show scheduled flows (mock UI)
- Show instant compliance reports (mock UI)
- Present privacy roadmap with Arc's planned Privacy Module

---

## 📁 File Structure Reference

### Configuration Files
- `/home/user/knight-c/.env` - Main environment variables (backend + deployment)
- `/home/user/knight-c/frontend/.env` - Frontend-specific variables

### Smart Contracts
- `/home/user/knight-c/src/TreasuryVault.sol` - Main treasury contract
- `/home/user/knight-c/script/Deploy.s.sol` - Deployment script

### Frontend
- `/home/user/knight-c/frontend/src/` - React application source
- `/home/user/knight-c/frontend/src/lib/wagmi.ts` - Web3 configuration
- `/home/user/knight-c/frontend/src/hooks/useUserRole.ts` - Role detection hook
- `/home/user/knight-c/frontend/src/components/` - UI components

### Backend
- `/home/user/knight-c/backend/src/app.ts` - Express server entry point
- `/home/user/knight-c/backend/src/routes/` - API routes
- `/home/user/knight-c/backend/src/services/` - Circle API integration

---

## 🔧 Troubleshooting

### Frontend Issues

**Problem**: Wallet connection fails
- **Solution**: Make sure you're on Arc Testnet (Chain ID: 5042002)
- Add Arc Testnet to MetaMask manually if needed

**Problem**: Contract calls fail
- **Solution**: Ensure you have testnet USDC for gas fees
- Get USDC from faucet: https://faucet.circle.com

**Problem**: Role badge not showing
- **Solution**: Check that your wallet address matches one of the role addresses in .env
- Disconnect and reconnect wallet to refresh

### Backend Issues

**Problem**: Backend not responding
- **Solution**: Check if backend is running: `curl http://localhost:3000/health`
- Restart backend: `npm run dev` from project root

**Problem**: CORS errors in browser console
- **Solution**: Ensure FRONTEND_URL in .env matches your frontend URL
- Default: `http://localhost:8080`

### Contract Issues

**Problem**: Contract address not set
- **Solution**: Check VITE_TREASURY_ADDRESS in frontend/.env
- Should be: `0x1aBEb3Ac46D9681A6cca2534bf8be8d2C07dA7B3`

**Problem**: CFO address mismatch
- **Solution**: Verify CFO_ADDRESS in .env matches contract CFO
- Check contract CFO: Visit ArcScan explorer link above

---

## 📝 Environment Variables Summary

### Critical Variables (Already Configured)

```bash
# Wallet Addresses
CFO_ADDRESS=0x8a7e77cb7d380ae79c2ac8c9928ecfe06ee840ab
VP_ADDRESS=0xe88f1f5b506d4e0122869c888fcb481fcf2476ce
EMPLOYEE_ADDRESS=0x5e2787391eca7099e3eb30dec7679f1c39d24ac8

# Contract Addresses
VITE_TREASURY_ADDRESS=0x1aBEb3Ac46D9681A6cca2534bf8be8d2C07dA7B3
VITE_USDC_ADDRESS=0x3600000000000000000000000000000000000000

# Network
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
VITE_CHAIN_ID=5042002

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=4a6b9d9122405c4ff66ad4ff1565f90b
```

---

## 🚀 Next Steps

1. **Test all role-based access scenarios** using different wallet addresses
2. **Verify contract interactions** work correctly for each role
3. **Test the full demo flow** from Act 1 to Act 7
4. **Document any issues** encountered during testing
5. **Prepare presentation materials** based on demo flow

---

## 📞 Support

For questions or issues:
- Check CLAUDE.md for detailed project documentation
- Review technical-prd.md for architecture details
- Read ROLE_BASED_ACCESS_IMPLEMENTATION.md for RBAC specifics

---

## ✅ Deployment Checklist

- [x] Environment variables configured
- [x] Smart contract deployed to Arc Testnet
- [x] Backend server running on port 3000
- [x] Frontend application running on port 8080
- [x] Role-based access control implemented
- [x] Wallet addresses configured for testing
- [x] Health check endpoint responding
- [ ] Full demo flow tested
- [ ] Contract funded with USDC
- [ ] Test pots created
- [ ] Multi-sig approvals tested
- [ ] Budget enforcement tested

**Last Updated**: 2025-11-15 15:16 UTC

---

**Status**: ✅ **READY FOR TESTING**

Everything is configured and running. You can now access the frontend at http://localhost:8080 and start testing the role-based access control and treasury management features!
