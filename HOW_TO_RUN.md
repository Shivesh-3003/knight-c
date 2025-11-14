# How to Run Knight-C Treasury - Complete Guide

## 🚀 Quick Start (Everything in Order)

### **Step 1: Verify Installation**
```bash
# Make sure you're in the project directory
cd /Users/shivesh/Desktop/knight-c

# Use Node.js 20
nvm use 20

# Check installation
npx hardhat --version
```

### **Step 2: Compile Contracts**
```bash
# Compile all smart contracts
npx hardhat compile

# You should see:
# ✅ Compiled 6 Solidity files successfully
```

### **Step 3: Verify Deployment**
```bash
# Run comprehensive verification
npx hardhat run scripts/verify-deployment.ts --network arcTestnet

# This checks:
# ✅ All contracts deployed
# ✅ Treasury functioning
# ✅ All 3 Pots working
# ✅ USDC integration
# ✅ Access control
```

### **Step 4: Test Complete Workflow**
```bash
# Run end-to-end workflow test
npx hardhat run scripts/test-complete-workflow.ts --network arcTestnet

# This demonstrates:
# ✅ Whitelisting beneficiaries
# ✅ Executing payments
# ✅ Budget tracking
# ✅ Payment history
```

---

## 📊 Check System Status Anytime

### **Option 1: Run Verification Script**
```bash
npx hardhat run scripts/verify-deployment.ts --network arcTestnet
```

### **Option 2: Use Hardhat Console** (Interactive)
```bash
npx hardhat console --network arcTestnet

# Then run these commands:
const treasury = await ethers.getContractAt("Treasury", "0x3940892e1e87C82fa7f314e5579045FCA370D092")

# Check total balance
const balance = await treasury.getTotalBalance()
console.log("Total:", ethers.formatUnits(balance, 6), "USDC")

# Get all Pots
const pots = await treasury.getAllPots()
console.log("Pots:", pots.length)

# Get Pot details
for (const potId of pots) {
  const addr = await treasury.getPotAddress(potId)
  const pot = await ethers.getContractAt("Pot", addr)
  const name = await pot.name()
  const remaining = await pot.getRemainingBudget()
  console.log(name + ":", ethers.formatUnits(remaining, 6), "USDC")
}
```

### **Option 3: View on Explorer**
```bash
# Open in browser
open https://testnet.arcscan.app/address/0x3940892e1e87C82fa7f314e5579045FCA370D092
```

---

## 💸 Execute Payments

### **Step-by-Step Payment Process**

```bash
# 1. Start Hardhat console
npx hardhat console --network arcTestnet

# 2. Get Pot contract
const potAddr = "0x50B9A34C600d037E03d4DD6487cFa814c885C58A" // Marketing Pot
const pot = await ethers.getContractAt("Pot", potAddr)

# 3. Whitelist beneficiary (if not already whitelisted)
const beneficiary = "0x...recipient_address"
await pot.whitelistBeneficiary(beneficiary)

# 4. Execute payment
const amount = ethers.parseUnits("10", 6) // $10 USDC
await pot.executePayment(beneficiary, amount, "Payment description")

# 5. Check new balance
const remaining = await pot.getRemainingBudget()
console.log("Remaining:", ethers.formatUnits(remaining, 6), "USDC")
```

---

## 🔄 Create Automated Flows

```bash
npx hardhat console --network arcTestnet

# Get Flow contract
const flow = await ethers.getContractAt("Flow", "0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8")

# Create payroll flow (bi-weekly)
const potAddress = "0x2DB55ED00C62C9aD595c6345fEE30A92A416746B" // Engineering
const employees = ["0x...emp1", "0x...emp2"]
const salaries = [
  ethers.parseUnits("1000", 6),
  ethers.parseUnits("1200", 6)
]

await flow.createPayrollFlow(
  potAddress,
  employees,
  salaries,
  1 // Frequency.BIWEEKLY
)

// Check active flows
const activeFlows = await flow.getActiveFlows()
console.log("Active flows:", activeFlows.length)
```

---

## 🎨 Run Frontend (When Ready)

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

---

## 📋 All Available Scripts

### **Deployment & Setup**
```bash
# Generate new wallet
npx hardhat run scripts/generate-wallet.ts

# Deploy contracts (already done)
npx hardhat run scripts/deploy.ts --network arcTestnet

# Setup treasury and pots (already done)
npx hardhat run scripts/setup-treasury.ts --network arcTestnet
```

### **Testing & Verification**
```bash
# Verify deployment
npx hardhat run scripts/verify-deployment.ts --network arcTestnet

# Test complete workflow
npx hardhat run scripts/test-complete-workflow.ts --network arcTestnet

# Run unit tests (after writing tests)
npx hardhat test
```

### **Interactive Console**
```bash
# Start interactive console
npx hardhat console --network arcTestnet

# Common commands in console:
# - Get signer: const [signer] = await ethers.getSigners()
# - Get contract: const c = await ethers.getContractAt("ContractName", "address")
# - Call function: await c.functionName(args)
# - Format USDC: ethers.formatUnits(amount, 6)
# - Parse USDC: ethers.parseUnits("10", 6)
```

---

## 🔍 Debugging & Troubleshooting

### **Check if contracts are deployed**
```bash
npx hardhat run scripts/verify-deployment.ts --network arcTestnet
```

### **Check wallet balance**
```bash
npx hardhat console --network arcTestnet

const [signer] = await ethers.getSigners()
const usdc = await ethers.getContractAt("IUSDC", "0x3600000000000000000000000000000000000000")
const balance = await usdc.balanceOf(signer.address)
console.log("USDC:", ethers.formatUnits(balance, 6))
```

### **View transaction on explorer**
```bash
# Replace TX_HASH with your transaction hash
open https://testnet.arcscan.app/tx/TX_HASH
```

### **Check gas balance** (Arc uses USDC for gas!)
```bash
npx hardhat console --network arcTestnet

const [signer] = await ethers.getSigners()
const balance = await ethers.provider.getBalance(signer.address)
console.log("Gas (USDC):", ethers.formatUnits(balance, 6))
```

### **Get more testnet USDC**
```bash
# Visit faucet
open https://faucet.circle.com

# Select: Arc Testnet
# Paste: 0xd5aD7fBF09A794e1E5aD651627C2fC092749e981
```

---

## 📊 Your Deployed Contracts

```
Treasury:   0x3940892e1e87C82fa7f314e5579045FCA370D092
Flow:       0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8

Engineering Pot: 0x2DB55ED00C62C9aD595c6345fEE30A92A416746B (Private)
Marketing Pot:   0x50B9A34C600d037E03d4DD6487cFa814c885C58A (Public)
Operations Pot:  0x3E01809399aB70312b91eb8cA62Cc69cCDe342B8 (Public)

USDC:       0x3600000000000000000000000000000000000000
Network:    Arc Testnet (Chain ID: 5042002)
```

---

## 🎯 Common Tasks Cheatsheet

### **Check System Status**
```bash
npx hardhat run scripts/verify-deployment.ts --network arcTestnet
```

### **Execute a Payment**
```bash
npx hardhat run scripts/test-complete-workflow.ts --network arcTestnet
```

### **Add Beneficiary**
```bash
npx hardhat console --network arcTestnet
const pot = await ethers.getContractAt("Pot", "POT_ADDRESS")
await pot.whitelistBeneficiary("0x...address")
```

### **Check Pot Balance**
```bash
npx hardhat console --network arcTestnet
const pot = await ethers.getContractAt("Pot", "POT_ADDRESS")
const balance = await pot.getRemainingBudget()
console.log(ethers.formatUnits(balance, 6), "USDC")
```

### **View on Explorer**
```bash
open https://testnet.arcscan.app/address/0x3940892e1e87C82fa7f314e5579045FCA370D092
```

---

## ✅ Daily Workflow

### **Morning Checklist**
1. Check system status
2. Review overnight transactions
3. Check Pot budgets
4. Execute pending payments

```bash
# Run this daily
npx hardhat run scripts/verify-deployment.ts --network arcTestnet
```

### **Before Making Payments**
1. Verify beneficiary is whitelisted
2. Check Pot has sufficient budget
3. Execute payment
4. Verify transaction on explorer

```bash
# Run workflow test to practice
npx hardhat run scripts/test-complete-workflow.ts --network arcTestnet
```

---

## 🆘 Need Help?

1. **Check Documentation**
   - `README.md` - Project overview
   - `DEPLOYMENT_GUIDE.md` - Complete guide
   - `QUICK_REFERENCE.md` - Commands reference

2. **Verify Deployment**
   ```bash
   npx hardhat run scripts/verify-deployment.ts --network arcTestnet
   ```

3. **Check Explorer**
   ```bash
   open https://testnet.arcscan.app/address/0x3940892e1e87C82fa7f314e5579045FCA370D092
   ```

4. **Get More USDC**
   ```bash
   open https://faucet.circle.com
   ```

---

## 🎉 You're All Set!

Your Knight-C Treasury is **fully operational** on Arc Network.

**Quick Test:**
```bash
# Run this to verify everything works
npx hardhat run scripts/test-complete-workflow.ts --network arcTestnet
```

**View Live:**
```bash
open https://testnet.arcscan.app/address/0x3940892e1e87C82fa7f314e5579045FCA370D092
```

Happy treasury managing! 🚀
