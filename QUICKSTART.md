# Knight-C Quick Start Guide

Get Knight-C running locally in 5 minutes.

## Prerequisites

- Node.js 18+
- Git
- MetaMask wallet

## 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

## 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# At minimum, set:
# - PRIVATE_KEY (for deployment)
# - ARC_TESTNET_RPC_URL (Arc RPC endpoint)
# - USDC_ADDRESS (USDC token on Arc)
```

## 3. Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 5 Solidity files successfully
```

## 4. Run Tests (Optional)

```bash
npm run test
```

## 5. Deploy to Local Network

For local testing without Arc testnet:

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.ts --network localhost
```

Save the output addresses!

## 6. Configure Frontend

Update `frontend/.env`:

```env
VITE_TREASURY_ADDRESS=<deployed_treasury_address>
VITE_USDC_ADDRESS=<usdc_address>
VITE_ARC_RPC_URL=http://localhost:8545
```

Update `frontend/src/lib/contracts.ts`:

```typescript
export const TREASURY_ADDRESS = '<deployed_treasury_address>' as const;
```

## 7. Start Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## 8. Connect Wallet & Test

1. **Connect MetaMask** to localhost:8545
2. **Import test account** (use private key from `npx hardhat node` output)
3. **Create a Pot**:
   - Navigate to "Pots" page
   - Click "Create New Pot"
   - Name: "Marketing"
   - Budget: 500000
   - Privacy: Public
   - Threshold: 100000
4. **Execute a Payment**:
   - Go to "Payments" page
   - Click "Execute Payment"
   - Select "Marketing" Pot
   - Enter recipient address
   - Amount: 80000
   - Purpose: "Test Payment"
   - Click "Execute"

## Deploy to Arc Testnet

Once local testing works:

1. Get Arc testnet tokens from faucet
2. Get Arc USDC from Circle
3. Update `.env` with Arc testnet RPC
4. Deploy: `npm run deploy:testnet`
5. Update frontend config with new addresses
6. Restart frontend and connect to Arc testnet

## Common Issues

### "Cannot find module"
```bash
npm install
cd frontend && npm install
```

### "Insufficient funds"
- Local: Ensure you imported a test account from `npx hardhat node`
- Testnet: Get tokens from Arc faucet

### "Contract not deployed"
- Check you ran `scripts/deploy.ts`
- Verify addresses in frontend config match deployment output

## Next Steps

- Read [ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand the system
- Check [API_REFERENCE.md](docs/API_REFERENCE.md) for contract functions
- See [TIER1_VS_ROADMAP.md](docs/TIER1_VS_ROADMAP.md) for feature status
- Review [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment

## Project Structure

```
knight-c/
├── contracts/          # Solidity smart contracts
│   ├── Treasury.sol   # Main treasury wallet
│   ├── Pot.sol        # Departmental budgets
│   └── Flow.sol       # Automated payments
├── frontend/          # React application
│   └── src/
│       ├── pages/     # Dashboard, Pots, Flows, etc.
│       ├── components/# Reusable UI components
│       └── hooks/     # Web3 integration hooks
├── scripts/           # Deployment scripts
├── test/             # Contract tests
└── docs/             # Documentation
```

## Getting Help

- **Documentation**: Check the `docs/` folder
- **Issues**: https://github.com/your-repo/issues
- **Arc Docs**: https://docs.arc.network
- **Circle Docs**: https://developers.circle.com

---

**Built on Arc. Powered by Circle. Secured by smart contracts.**
