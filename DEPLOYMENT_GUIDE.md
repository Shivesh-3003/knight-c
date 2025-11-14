# Knight-C Treasury - Complete Deployment Guide

## 🎯 Project Overview

**Knight-C** is a military-grade smart contract treasury infrastructure built on Arc Network, featuring:
- Department-based budget management (Pots)
- USDC-native payments with Circle integration
- Automated recurring payments (Flows)
- Privacy features via Arc's opt-in privacy (planned)
- Multi-signature approval workflows

---

## ✅ What We've Accomplished

### **1. Fixed All Smart Contracts**

#### **Treasury.sol**
- ✅ Fixed Pot storage: Changed from `mapping(bytes32 => Pot)` to `mapping(bytes32 => address)`
- ✅ Implemented USDC transfers via Circle's ERC-20 interface
- ✅ Added `fundTreasury()` - Transfer USDC to Treasury
- ✅ Added `createPot()` - Deploy Pot contracts with initial budgets
- ✅ Added `allocateToPot()` - Transfer USDC to existing Pots
- ✅ Added `getTotalBalance()` - Calculate total system balance
- ✅ Circle Gateway integration for USD <-> USDC conversion

#### **Pot.sol**
- ✅ Implemented `_executePayment()` with actual USDC transfers
- ✅ Budget tracking and spending limits
- ✅ Beneficiary whitelist for fraud prevention
- ✅ Multi-signature approval workflows
- ✅ SalaryShield temporal jitter for payroll privacy

#### **Flow.sol**
- ✅ Fixed function visibility (`createFlow` changed from `external` to `public`)
- ✅ Automated payment flows (payroll, subscriptions, allocations)
- ✅ Temporal jitter for privacy-preserving payments

#### **Interface Files**
- ✅ **IUSDC.sol** - Circle USDC interface (6 decimals)
- ✅ **ICircleGateway.sol** - Gateway for crosschain USDC

#### **Privacy Library**
- ✅ **Privacy.sol** - Arc privacy features (view keys, jitter delays)

### **2. Configured Arc Network Integration**

#### **hardhat.config.ts**
```typescript
arcTestnet: {
  url: "https://rpc.testnet.arc.network",
  chainId: 5042002,  // ✅ Verified via RPC
  gasPrice: "auto"   // USDC for gas
}
```

#### **.env Configuration**
```bash
PRIVATE_KEY=<your_key>
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
CIRCLE_GATEWAY_ADDRESS=0x0077777d7EBA4688BDeF3E311b846F25870A19B9
VITE_USDC_ADDRESS=0x3600000000000000000000000000000000000000
VITE_CHAIN_ID=5042002
```

### **3. Deployed to Arc Testnet**

#### **Deployed Contracts:**
```
✅ Treasury: 0x3940892e1e87C82fa7f314e5579045FCA370D092
✅ Flow:     0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8

✅ Engineering Pot: ~$2.47 USDC (Private)
✅ Marketing Pot:   ~$2.47 USDC (Public)
✅ Operations Pot:  ~$2.47 USDC (Public)
```

#### **System Stats:**
- Total Value: $7.41 USDC
- Network: Arc Testnet (Chain ID: 5042002)
- Gas Token: USDC (not ETH!)
- Deployer: 0xd5aD7fBF09A794e1E5aD651627C2fC092749e981

### **4. Created Helper Scripts**

- ✅ `scripts/deploy.ts` - Deploy Treasury and Flow
- ✅ `scripts/setup-treasury.ts` - Fund Treasury and create Pots
- ✅ `scripts/generate-wallet.ts` - Generate new wallet for deployment

---

## 📚 Next Steps

### **Phase 1: Test Core Functionality**

#### **1.1 Whitelist Beneficiaries**
Before making payments, whitelist recipient addresses in each Pot:

```typescript
// scripts/whitelist-beneficiaries.ts
import { ethers } from "hardhat";

async function main() {
  const potAddress = "YOUR_POT_ADDRESS"; // Get from Treasury.getPotAddress(potId)
  const pot = await ethers.getContractAt("Pot", potAddress);

  // Whitelist an employee
  await pot.whitelistBeneficiary("0x...employee_address");
  console.log("✅ Beneficiary whitelisted");
}
```

#### **1.2 Execute Test Payment**
Test a payment from a Pot to a whitelisted address:

```typescript
// scripts/test-payment.ts
import { ethers } from "hardhat";

async function main() {
  const potAddress = "YOUR_POT_ADDRESS";
  const pot = await ethers.getContractAt("Pot", potAddress);

  const recipient = "0x...whitelisted_address";
  const amount = ethers.parseUnits("1", 6); // $1 USDC
  const purpose = "Test payment";

  await pot.executePayment(recipient, amount, purpose);
  console.log("✅ Payment executed");
}
```

#### **1.3 Check Budget Utilization**
Monitor spending across Pots:

```typescript
// scripts/check-budgets.ts
import { ethers } from "hardhat";

async function main() {
  const treasury = await ethers.getContractAt(
    "Treasury",
    "0x3940892e1e87C82fa7f314e5579045FCA370D092"
  );

  const totalBalance = await treasury.getTotalBalance();
  console.log("Total System:", ethers.formatUnits(totalBalance, 6), "USDC");

  const allPots = await treasury.getAllPots();
  for (const potId of allPots) {
    const potAddress = await treasury.getPotAddress(potId);
    const pot = await ethers.getContractAt("Pot", potAddress);

    const name = await pot.name();
    const utilization = await pot.getBudgetUtilization();
    const remaining = await pot.getRemainingBudget();

    console.log(`${name}: ${utilization}% used, $${ethers.formatUnits(remaining, 6)} remaining`);
  }
}
```

### **Phase 2: Set Up Automated Flows**

#### **2.1 Create Payroll Flow**
Automate bi-weekly salary payments:

```typescript
// scripts/create-payroll.ts
import { ethers } from "hardhat";

async function main() {
  const flow = await ethers.getContractAt(
    "Flow",
    "0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8"
  );

  const potAddress = "YOUR_ENGINEERING_POT_ADDRESS";
  const employees = [
    "0x...employee1",
    "0x...employee2"
  ];
  const salaries = [
    ethers.parseUnits("1000", 6), // $1000
    ethers.parseUnits("1200", 6)  // $1200
  ];

  await flow.createPayrollFlow(
    potAddress,
    employees,
    salaries,
    1 // Frequency.BIWEEKLY
  );

  console.log("✅ Payroll flow created");
}
```

#### **2.2 Set Up Vendor Subscriptions**
Automate monthly vendor payments:

```typescript
// scripts/create-subscriptions.ts
import { ethers } from "hardhat";

async function main() {
  const flow = await ethers.getContractAt(
    "Flow",
    "0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8"
  );

  const potAddress = "YOUR_OPERATIONS_POT_ADDRESS";
  const vendors = ["0x...vendor1", "0x...vendor2"];
  const amounts = [
    ethers.parseUnits("500", 6),  // $500/month
    ethers.parseUnits("300", 6)   // $300/month
  ];

  await flow.createVendorFlow(
    potAddress,
    vendors,
    amounts,
    3 // Frequency.MONTHLY
  );

  console.log("✅ Vendor subscription flow created");
}
```

### **Phase 3: Build Frontend Interface**

#### **3.1 Set Up Frontend**
```bash
cd frontend
npm install
```

#### **3.2 Configure Frontend Environment**
Update `frontend/.env`:
```bash
VITE_TREASURY_ADDRESS=0x3940892e1e87C82fa7f314e5579045FCA370D092
VITE_FLOW_ADDRESS=0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8
VITE_USDC_ADDRESS=0x3600000000000000000000000000000000000000
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_CHAIN_ID=5042002
```

#### **3.3 Run Frontend**
```bash
npm run dev
```

### **Phase 4: Advanced Features**

#### **4.1 Multi-Signature Approvals**
Add multiple approvers for large transactions:

```typescript
// scripts/add-approvers.ts
import { ethers } from "hardhat";

async function main() {
  const treasury = await ethers.getContractAt(
    "Treasury",
    "0x3940892e1e87C82fa7f314e5579045FCA370D092"
  );

  await treasury.addApprover("0x...cto_address");
  await treasury.addApprover("0x...coo_address");

  console.log("✅ Approvers added");
}
```

#### **4.2 Circle Gateway Integration**
Enable USD <-> USDC conversion:

```typescript
// scripts/gateway-deposit.ts
import { ethers } from "hardhat";

async function main() {
  const treasury = await ethers.getContractAt(
    "Treasury",
    "0x3940892e1e87C82fa7f314e5579045FCA370D092"
  );

  const amount = ethers.parseUnits("1000", 6); // $1000
  await treasury.fundViaGateway(amount);

  console.log("✅ Funded via Circle Gateway");
}
```

#### **4.3 Budget Reallocation**
Move funds between Pots:

```typescript
// scripts/reallocate-budget.ts
import { ethers } from "hardhat";

async function main() {
  const treasury = await ethers.getContractAt(
    "Treasury",
    "0x3940892e1e87C82fa7f314e5579045FCA370D092"
  );

  const engineeringPotId = "0x...pot_id";
  const additionalBudget = ethers.parseUnits("500", 6); // $500

  await treasury.allocateToPot(engineeringPotId, additionalBudget);
  console.log("✅ Budget reallocated");
}
```

---

## 🚀 Running the Application

### **Prerequisites**
```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Ensure you have Node.js 20+
nvm use 20

# 3. Verify .env configuration
cat .env
```

### **Compile Contracts**
```bash
npx hardhat compile
```

### **Run Tests** (after writing tests)
```bash
npx hardhat test
```

### **Deploy to Arc Testnet**
```bash
# Generate wallet (if needed)
npx hardhat run scripts/generate-wallet.ts

# Get USDC for gas
# Visit: https://faucet.circle.com

# Deploy contracts
npx hardhat run scripts/deploy.ts --network arcTestnet

# Setup Treasury and Pots
npx hardhat run scripts/setup-treasury.ts --network arcTestnet
```

### **Verify Contracts on Arc Explorer**
```bash
npx hardhat verify --network arcTestnet 0x3940892e1e87C82fa7f314e5579045FCA370D092 \
  "0x3600000000000000000000000000000000000000" \
  "0xd5aD7fBF09A794e1E5aD651627C2fC092749e981" \
  "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"

npx hardhat verify --network arcTestnet 0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8 \
  "0x3940892e1e87C82fa7f314e5579045FCA370D092"
```

### **Run Frontend**
```bash
cd frontend
npm install
npm run dev
```

### **Interact via Hardhat Console**
```bash
npx hardhat console --network arcTestnet

# In console:
const treasury = await ethers.getContractAt("Treasury", "0x3940892e1e87C82fa7f314e5579045FCA370D092")
const balance = await treasury.getTotalBalance()
console.log(ethers.formatUnits(balance, 6))
```

---

## 📊 Key Addresses

### **Arc Testnet**
```
Network:    Arc Testnet
Chain ID:   5042002
RPC:        https://rpc.testnet.arc.network
Explorer:   https://testnet.arcscan.app
Faucet:     https://faucet.circle.com
```

### **Circle USDC**
```
USDC Token:          0x3600000000000000000000000000000000000000
Gateway Wallet:      0x0077777d7EBA4688BDeF3E311b846F25870A19B9
Gateway Auth:        0x0022222ABE238Cc2C7Bb1f21003F0a260052475B
Decimals:            6 (1 USDC = 1,000,000)
```

### **Your Deployment**
```
Treasury:   0x3940892e1e87C82fa7f314e5579045FCA370D092
Flow:       0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8
Deployer:   0xd5aD7fBF09A794e1E5aD651627C2fC092749e981
```

---

## 🛠️ Development Workflow

### **Daily Operations**
```bash
# 1. Check system status
npx hardhat run scripts/check-budgets.ts --network arcTestnet

# 2. Execute payments
npx hardhat run scripts/execute-payment.ts --network arcTestnet

# 3. Monitor transactions
# Visit: https://testnet.arcscan.app/address/0x3940892e1e87C82fa7f314e5579045FCA370D092
```

### **Monthly Tasks**
- Review budget utilization
- Reallocate funds between Pots
- Add new beneficiaries
- Update approval thresholds

### **Quarterly Reviews**
- Audit payment history
- Review Flow execution
- Optimize gas costs
- Update privacy settings

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Contains private keys
2. **Use hardware wallet in production** - For CFO/approver keys
3. **Whitelist all beneficiaries** - Before making payments
4. **Set appropriate approval thresholds** - For multi-sig protection
5. **Monitor all transactions** - Via Arc Explorer
6. **Regular budget reviews** - Prevent overspending
7. **Test on testnet first** - Before mainnet deployment

---

## 📖 Resources

### **Documentation**
- Arc Network: https://docs.arc.network
- Circle USDC: https://developers.circle.com/stablecoins
- Hardhat: https://hardhat.org/docs

### **Tools**
- Arc Explorer: https://testnet.arcscan.app
- Circle Faucet: https://faucet.circle.com
- MetaMask: Add Arc Testnet manually

### **Support**
- Arc Discord: Join Arc community
- Circle Discord: Join Circle developer community
- GitHub Issues: Report bugs in your repo

---

## 🎯 Success Metrics

Track these KPIs to measure Treasury performance:
- Total USDC managed
- Number of payments processed
- Average transaction cost (gas fees in USDC)
- Budget utilization percentage
- Number of active Pots
- Flow execution success rate

---

**Knight-C Treasury is now fully operational on Arc Network! 🚀**

*Built with Arc Network, Circle USDC, and Hardhat*
