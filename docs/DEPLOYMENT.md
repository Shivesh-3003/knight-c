# Knight-C Deployment Guide

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Git
- MetaMask or compatible Web3 wallet
- Arc testnet USDC tokens

### Required Accounts
- Arc testnet wallet with native tokens for gas
- Circle account for Gateway integration
- WalletConnect Project ID (for frontend)

## Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd knight-c

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 2: Environment Configuration

Create `.env` file in root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Deployment wallet
PRIVATE_KEY=your_private_key_here

# Arc Testnet RPC
ARC_TESTNET_RPC_URL=https://rpc.arc-testnet.network

# USDC token address on Arc (from Circle)
USDC_ADDRESS=0x...

# Circle Gateway API credentials
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_ID=your_circle_entity_id
```

## Step 3: Compile Contracts

```bash
npm run compile
```

This will:
- Compile all Solidity contracts
- Generate TypeScript type definitions
- Output ABIs to `artifacts/` directory

## Step 4: Run Tests

```bash
npm run test
```

Verify all tests pass before deployment.

## Step 5: Deploy to Arc Testnet

```bash
npm run deploy:testnet
```

The deployment script will:
1. Deploy Treasury contract
2. Deploy Flow contract
3. Create initial Pots (Engineering, Marketing, Operations)
4. Output contract addresses

**Save the output!** You'll need the Treasury address for the frontend.

Example output:
```
=== Deployment Summary ===
Network: arcTestnet
Treasury Address: 0xabc123...
Flow Address: 0xdef456...
CFO Address: 0x789...

Update frontend .env with:
VITE_TREASURY_ADDRESS=0xabc123...
```

## Step 6: Verify Contracts

```bash
npx hardhat verify --network arcTestnet <TREASURY_ADDRESS> "<USDC_ADDRESS>" "<CFO_ADDRESS>"
npx hardhat verify --network arcTestnet <FLOW_ADDRESS> "<TREASURY_ADDRESS>"
```

## Step 7: Configure Frontend

Update `frontend/.env`:

```env
VITE_TREASURY_ADDRESS=<deployed_treasury_address>
VITE_USDC_ADDRESS=<arc_usdc_address>
VITE_ARC_RPC_URL=https://rpc.arc-testnet.network
VITE_WALLETCONNECT_PROJECT_ID=<your_project_id>
```

Update `frontend/src/lib/wagmi.ts` with correct Arc chain ID:

```typescript
const arcTestnet = {
  id: 12345, // Replace with actual Arc testnet chain ID
  // ...
};
```

Update `frontend/src/lib/contracts.ts` with deployed addresses:

```typescript
export const TREASURY_ADDRESS = '<deployed_treasury_address>' as const;
export const USDC_ADDRESS = '<arc_usdc_address>' as const;
```

## Step 8: Start Frontend

```bash
cd frontend
npm run dev
```

The application will open at `http://localhost:3000`

## Step 9: Fund Treasury (Circle Gateway)

### Via Circle Gateway UI
1. Navigate to Circle Gateway dashboard
2. Select Arc as destination network
3. Deposit USD → USDC to your treasury address

### Via Smart Contract
```typescript
// In your frontend, call:
await treasury.fundTreasury(amount);
```

## Verification Checklist

- [ ] All contracts deployed successfully
- [ ] Contracts verified on Arc block explorer
- [ ] Frontend connects to Arc testnet
- [ ] Can view treasury balance
- [ ] Can create Pots with budget allocations
- [ ] Can execute payments with budget enforcement
- [ ] Multi-sig approval workflow functions
- [ ] Real-time balance updates work

## Troubleshooting

### "Insufficient gas" error
- Ensure deployer wallet has enough Arc native tokens for gas
- Note: Gas is paid in USDC on Arc, but you still need native tokens

### "USDC transfer failed"
- Verify USDC_ADDRESS is correct for Arc testnet
- Check treasury contract has USDC approval
- Ensure sender has sufficient USDC balance

### Frontend not connecting
- Check Arc chain ID matches in wagmi.ts
- Verify RPC URL is accessible
- Ensure MetaMask is on Arc testnet network

### Contract interaction fails
- Verify contract addresses are correctly updated in frontend
- Check wallet is connected to correct network
- Ensure ABI matches deployed contract version

## Production Deployment

For mainnet deployment:

1. Update `hardhat.config.ts` with Arc mainnet configuration
2. Use hardware wallet or secure key management
3. Conduct security audit of all contracts
4. Test thoroughly on testnet first
5. Deploy with multi-signature deployment wallet
6. Implement timelock for critical operations
7. Set up monitoring and alerting
8. Configure Circle Gateway for production

## Post-Deployment Tasks

1. **Add Approvers**: Use `treasury.addApprover()` to add department heads
2. **Whitelist Beneficiaries**: For each Pot, whitelist approved payment recipients
3. **Configure Flows**: Set up recurring payments for payroll, vendors
4. **Test Payment Execution**: Execute small test payments to verify system
5. **Generate Audit Report**: Test compliance reporting functionality
6. **Document Addresses**: Keep secure record of all deployed contract addresses

## Security Best Practices

- Never commit `.env` file to version control
- Use hardware wallet for CFO operations in production
- Implement 24-hour time-locks for new beneficiary additions
- Regular security audits of smart contracts
- Multi-signature requirements for high-value operations
- Monitoring and alerting for unusual activity

## Support

For deployment issues:
- Check Arc documentation: https://docs.arc.network
- Circle Gateway docs: https://developers.circle.com
- Knight-C GitHub issues: <repository-url>/issues
