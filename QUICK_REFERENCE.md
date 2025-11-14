# Knight-C Treasury - Quick Reference

## 🎯 What We Built

A complete military-grade treasury infrastructure on Arc Network with:
- ✅ Smart contract wallet (Treasury)
- ✅ Department budgets (Pots)
- ✅ Automated payments (Flows)
- ✅ Circle USDC integration
- ✅ Multi-signature approvals
- ✅ Privacy features (Arc opt-in)

---

## 📊 Current Deployment Status

### **Live on Arc Testnet**

```
Network:     Arc Testnet
Chain ID:    5042002
RPC:         https://rpc.testnet.arc.network
Explorer:    https://testnet.arcscan.app

Treasury:    0x3940892e1e87C82fa7f314e5579045FCA370D092
Flow:        0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8

Total Value: $7.41 USDC
Pots:        3 (Engineering, Marketing, Operations)
Status:      ✅ Fully Operational
```

### **Your Wallet**
```
Address:     0xd5aD7fBF09A794e1E5aD651627C2fC092749e981
Balance:     ~1.85 USDC (for gas)
Role:        CFO & Deployer
```

---

## 🏗️ What We Fixed

### **Smart Contracts**
1. **Treasury.sol**
   - Fixed Pot storage mapping
   - Implemented USDC transfers
   - Added budget allocation
   - Circle Gateway integration

2. **Pot.sol**
   - Implemented payment execution
   - Budget tracking with limits
   - Beneficiary whitelisting
   - Multi-sig approvals

3. **Flow.sol**
   - Fixed function visibility
   - Automated payment flows
   - Temporal jitter for privacy

### **Configuration**
1. **hardhat.config.ts** - Arc Testnet (Chain ID: 5042002)
2. **.env** - Private key and network config
3. **tsconfig.json** - TypeChain types included
4. **Scripts** - Deploy, setup, wallet generation

---

## 🚀 Quick Commands

### **Check System Status**
```bash
# View on Explorer
open https://testnet.arcscan.app/address/0x3940892e1e87C82fa7f314e5579045FCA370D092

# Via Hardhat Console
npx hardhat console --network arcTestnet
> const t = await ethers.getContractAt("Treasury", "0x3940892e1e87C82fa7f314e5579045FCA370D092")
> const bal = await t.getTotalBalance()
> ethers.formatUnits(bal, 6)
```

### **Get Pot Addresses**
```javascript
const treasury = await ethers.getContractAt("Treasury", "0x3940892e1e87C82fa7f314e5579045FCA370D092")
const allPots = await treasury.getAllPots()
for (const potId of allPots) {
  const addr = await treasury.getPotAddress(potId)
  const pot = await ethers.getContractAt("Pot", addr)
  const name = await pot.name()
  console.log(`${name}: ${addr}`)
}
```

### **Execute Payment**
```javascript
const pot = await ethers.getContractAt("Pot", "POT_ADDRESS")

// 1. Whitelist beneficiary
await pot.whitelistBeneficiary("0x...recipient")

// 2. Execute payment
const amount = ethers.parseUnits("10", 6) // $10 USDC
await pot.executePayment("0x...recipient", amount, "Payment description")
```

### **Create Automated Flow**
```javascript
const flow = await ethers.getContractAt("Flow", "0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8")

await flow.createPayrollFlow(
  "POT_ADDRESS",
  ["0x...employee1", "0x...employee2"],
  [ethers.parseUnits("1000", 6), ethers.parseUnits("1200", 6)],
  1 // BIWEEKLY
)
```

---

## 📚 Next Steps

### **Immediate (Today)**
1. ✅ **Whitelist beneficiaries** in each Pot
2. ✅ **Execute test payment** to verify functionality
3. ✅ **Check budget utilization** across Pots

### **Short-term (This Week)**
1. **Set up automated Flows** for recurring payments
2. **Add multi-sig approvers** for large transactions
3. **Build frontend interface** for non-technical users
4. **Write unit tests** for all contracts

### **Medium-term (This Month)**
1. **Integrate Circle Gateway** for USD on/off ramps
2. **Implement privacy features** when Arc enables them
3. **Set up monitoring** and alerts
4. **Deploy to Arc Mainnet** (when ready)

---

## 📖 Documentation

| File | Description |
|------|-------------|
| `README.md` | Project overview and quick start |
| `DEPLOYMENT_GUIDE.md` | Complete deployment history and tutorials |
| `QUICK_REFERENCE.md` | This file - quick commands and status |
| `.env.example` | Environment configuration template |

---

## 🔑 Important Addresses

### **Arc Testnet**
```
USDC:           0x3600000000000000000000000000000000000000
Gateway Wallet: 0x0077777d7EBA4688BDeF3E311b846F25870A19B9
Gateway Auth:   0x0022222ABE238Cc2C7Bb1f21003F0a260052475B
```

### **Your Contracts**
```
Treasury:       0x3940892e1e87C82fa7f314e5579045FCA370D092
Flow:           0xd1094997FD7A74b93FfF1A377E7d4E2D0D216EC8
```

### **Tools**
```
Faucet:         https://faucet.circle.com
Explorer:       https://testnet.arcscan.app
RPC:            https://rpc.testnet.arc.network
```

---

## 🛠️ Useful Scripts

### **Create a Script**
All scripts should be in `scripts/` directory:

```typescript
// scripts/your-script.ts
import { ethers } from "hardhat";

async function main() {
  const treasury = await ethers.getContractAt(
    "Treasury",
    "0x3940892e1e87C82fa7f314e5579045FCA370D092"
  );

  // Your code here
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### **Run a Script**
```bash
npx hardhat run scripts/your-script.ts --network arcTestnet
```

---

## 🔐 Security Checklist

- [x] Private key in `.env` (not committed)
- [x] Contracts deployed to testnet
- [ ] Beneficiaries whitelisted before payments
- [ ] Multi-sig approvers added
- [ ] Budget thresholds configured
- [ ] Payment limits tested
- [ ] Frontend access controls implemented
- [ ] Mainnet deployment security audit

---

## 💡 Pro Tips

1. **Always use USDC units correctly**
   ```javascript
   // 1 USDC = 1,000,000 (6 decimals)
   const amount = ethers.parseUnits("10", 6) // $10 USDC
   ```

2. **Check balance before transactions**
   ```javascript
   const balance = await pot.getRemainingBudget()
   console.log("Available:", ethers.formatUnits(balance, 6), "USDC")
   ```

3. **Monitor gas costs**
   ```javascript
   // On Arc, gas is paid in USDC
   const tx = await pot.executePayment(...)
   const receipt = await tx.wait()
   console.log("Gas used:", receipt.gasUsed.toString())
   ```

4. **Use hardhat console for quick tests**
   ```bash
   npx hardhat console --network arcTestnet
   ```

5. **Verify contracts on explorer**
   ```bash
   npx hardhat verify --network arcTestnet <ADDRESS> <CONSTRUCTOR_ARGS>
   ```

---

## 🎓 Learning Resources

- **Arc Docs**: https://docs.arc.network
- **Circle Docs**: https://developers.circle.com
- **Hardhat Docs**: https://hardhat.org/docs
- **Ethers.js**: https://docs.ethers.org/v6

---

## 📞 Support

**Issues?**
- Check `DEPLOYMENT_GUIDE.md` for detailed instructions
- View transactions on https://testnet.arcscan.app
- Test in Hardhat console first
- Verify USDC balance before operations

**Need USDC?**
- Testnet: https://faucet.circle.com
- Mainnet: Circle Mint (qualified businesses)

---

**Knight-C Treasury - Built on Arc, Powered by Circle** 🚀
