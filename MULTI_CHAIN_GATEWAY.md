# Multi-Chain Gateway Support

Knight-C now supports Circle Gateway cross-chain USDC transfers from **multiple testnet chains** to Arc Testnet for treasury funding.

## Supported Chains

| Chain | Network | Domain ID | USDC Address | Chain ID |
|-------|---------|-----------|--------------|----------|
| **Ethereum Sepolia** | sepolia | 0 | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | 11155111 |
| **Base Sepolia** | base | 6 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | 84532 |
| **Arbitrum Sepolia** | arbitrum | 3 | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | 421614 |
| **Polygon Amoy** | polygon | 7 | `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` | 80002 |
| **Avalanche Fuji** | avalanche | 1 | `0x5425890298aed601595a70ab815c96711a31bc65` | 43113 |
| **Arc Testnet** | arc | 26 | `0x3600000000000000000000000000000000000000` | 5042002 |

## Quick Start

### 1. Get Testnet USDC

Visit [Circle's Testnet Faucet](https://faucet.circle.com) to get USDC on any supported chain.

**Important**: You also need native gas tokens:
- **Ethereum Sepolia**: ETH from [Sepolia Faucet](https://sepoliafaucet.com)
- **Base Sepolia**: ETH (Base uses ETH for gas)
- **Arbitrum Sepolia**: ETH (Arbitrum uses ETH for gas)
- **Polygon Amoy**: POL from [Polygon Faucet](https://faucet.polygon.technology)
- **Avalanche Fuji**: AVAX from [Avalanche Faucet](https://core.app/tools/testnet-faucet)
- **Arc Testnet**: USDC (Arc uses USDC as gas token)

### 2. Configure Source Chain

Set the `SOURCE_CHAIN` environment variable to choose your source chain:

```bash
# .env or command line
SOURCE_CHAIN=base          # Base Sepolia
SOURCE_CHAIN=arbitrum      # Arbitrum Sepolia
SOURCE_CHAIN=polygon       # Polygon Amoy
SOURCE_CHAIN=avalanche     # Avalanche Fuji
SOURCE_CHAIN=sepolia       # Ethereum Sepolia (default)
```

### 3. Run Treasury Funding Script

```bash
# Fund treasury from Base Sepolia
SOURCE_CHAIN=base ts-node scripts/fund-treasury-via-gateway.ts

# Fund treasury from Arbitrum Sepolia with 10 USDC
SOURCE_CHAIN=arbitrum DEPOSIT_AMOUNT=10 ts-node scripts/fund-treasury-via-gateway.ts

# Fund treasury from Polygon Amoy
SOURCE_CHAIN=polygon ts-node scripts/fund-treasury-via-gateway.ts
```

## API Endpoints

The backend now provides balance check endpoints for all supported chains:

### Check Balance on Any Chain

```bash
# Ethereum Sepolia
GET /api/circle/balance/sepolia/:address

# Base Sepolia
GET /api/circle/balance/base/:address

# Arbitrum Sepolia
GET /api/circle/balance/arbitrum/:address

# Polygon Amoy
GET /api/circle/balance/polygon/:address

# Avalanche Fuji
GET /api/circle/balance/avalanche/:address

# Arc Testnet
GET /api/circle/balance/arc/:address

# Gateway Unified Balance (across all chains)
GET /api/circle/balance/gateway/:address
```

### Example Response

```json
{
  "success": true,
  "data": {
    "balance": "100.50",
    "currency": "USDC",
    "chain": "Base Sepolia",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }
}
```

## How It Works

### Circle Gateway Unified Balance

Circle Gateway creates a **unified USDC balance** across all supported chains:

1. **Deposit**: Deposit USDC to Gateway Wallet on **any** supported chain
2. **Unified Balance**: Your deposit creates a balance accessible from **all** chains
3. **Instant Transfer**: After initial finality, transfers to any chain are **instant** (<500ms)
4. **No Bridging**: No traditional bridging - Circle's attestation service handles everything

### Transfer Flow

```
Source Chain (e.g., Base) → Gateway Wallet → Unified Balance
                                                    ↓
                                         Create Burn Intent (EIP-712)
                                                    ↓
                                         Submit to Gateway API
                                                    ↓
                                         Receive Attestation
                                                    ↓
                               Destination Chain (Arc) ← gatewayMint()
```

### First-Time vs. Subsequent Transfers

**First Transfer from a Chain:**
- Deposit USDC → Wait for finality (~12-15 minutes for Ethereum-based chains)
- This wait is **front-loaded** - you only wait once per source chain

**Subsequent Transfers:**
- Your unified balance is already finalized
- Transfers are **instant** (<500ms)
- No waiting for finality

## Technical Details

### Gateway Contract Addresses

These addresses are **the same across all testnets** (deployed by Circle):

- **Gateway Wallet**: `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`
- **Gateway Minter**: `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B`

### EIP-712 Burn Intent

Transfers use EIP-712 typed data signing:

```typescript
{
  maxBlockHeight: uint256,  // Max uint256 for 7+ days validity
  maxFee: uint256,          // 2.01 USDC (minimum 2.0001 required)
  spec: {
    version: 1,
    sourceDomain: 6,        // e.g., Base Sepolia
    destinationDomain: 26,  // Arc Testnet
    sourceContract: bytes32,
    destinationContract: bytes32,
    sourceToken: bytes32,
    destinationToken: bytes32,
    sourceDepositor: bytes32,
    destinationRecipient: bytes32,
    sourceSigner: bytes32,
    destinationCaller: bytes32,
    value: uint256,
    salt: bytes32,
    hookData: bytes
  }
}
```

### Fee Structure

- **Minimum maxFee**: 2.0001 USDC (Circle Gateway requirement)
- **Actual Fee**: Typically < $0.01
- **Total Required**: `DEPOSIT_AMOUNT + 2.0001 USDC` in unified balance

Examples:
- Transfer 5 USDC → Need 7.0001 USDC in unified balance
- Transfer 10 USDC → Need 12.0001 USDC in unified balance

## Chain-Specific Notes

### Base Sepolia
- Uses **flashblocks-aware RPC**: `https://sepolia-preconf.base.org`
- Provides faster finality and better UX for Base transactions
- Recommended for quick testing

### Arbitrum Sepolia
- Standard Arbitrum testnet
- Fast and cheap transactions
- Good for high-volume testing

### Polygon Amoy
- Polygon's new testnet (replaces Mumbai)
- Very fast block times
- Low gas costs

### Avalanche Fuji
- Avalanche's C-Chain testnet
- Sub-second finality
- Different native token (AVAX) for gas

### Arc Testnet
- **Destination chain** for all treasury deposits
- Uses USDC as gas token (unique!)
- Sub-second finality (~0.4s)
- Perfect for treasury management

## Example Workflows

### Scenario 1: First-Time Base → Arc Transfer

```bash
# 1. Get USDC on Base Sepolia from faucet
# 2. Get ETH for gas on Base Sepolia

# 3. Run the script
SOURCE_CHAIN=base DEPOSIT_AMOUNT=5 ts-node scripts/fund-treasury-via-gateway.ts

# Process:
# ✓ Deposits 5 USDC to Gateway Wallet on Base
# ⏳ Waits ~12-15 minutes for Base finality
# ✓ Creates burn intent for Arc
# ✓ Submits to Gateway API
# ✓ Mints USDC on Arc (<500ms)
# ✓ Deposits to Treasury contract
```

### Scenario 2: Additional Transfer from Same Chain

```bash
# Already have unified balance from previous Base deposit
SOURCE_CHAIN=base DEPOSIT_AMOUNT=10 SKIP_FINALITY_WAIT=true ts-node scripts/fund-treasury-via-gateway.ts

# Process:
# ✓ Uses existing unified balance
# ⚡ Instant transfer (<500ms) - no finality wait!
# ✓ Mints USDC on Arc
# ✓ Deposits to Treasury
```

### Scenario 3: Multi-Chain Funding

```bash
# Get USDC from different chains for redundancy

# Day 1: Fund from Base
SOURCE_CHAIN=base DEPOSIT_AMOUNT=5 ts-node scripts/fund-treasury-via-gateway.ts

# Day 2: Fund from Arbitrum
SOURCE_CHAIN=arbitrum DEPOSIT_AMOUNT=7 ts-node scripts/fund-treasury-via-gateway.ts

# Day 3: Fund from Polygon
SOURCE_CHAIN=polygon DEPOSIT_AMOUNT=10 ts-node scripts/fund-treasury-via-gateway.ts

# Result: Treasury funded from multiple chains, increasing resilience
```

## Troubleshooting

### Error: "Insufficient balance for depositor"

**Problem**: Not enough USDC in unified balance to cover transfer + fees.

**Solution**:
```bash
# Check your unified balance
curl http://localhost:3000/api/circle/balance/gateway/YOUR_ADDRESS

# Ensure you have: transfer_amount + 2.0001 USDC
# If transferring 5 USDC, you need at least 7.0001 USDC total
```

### Error: "Invalid attestation or signature"

**Problem**: Tried to transfer before source chain finality.

**Solution**:
- Don't use `SKIP_FINALITY_WAIT=true` for first transfer from a chain
- Wait for the full finality period before creating burn intent

### Error: "Unsupported chain"

**Problem**: Invalid `SOURCE_CHAIN` value.

**Solution**: Use one of the supported values:
- `sepolia`, `base`, `arbitrum`, `polygon`, `avalanche`

## Best Practices

1. **Testing**: Start with Base Sepolia - faster and more reliable than Ethereum Sepolia
2. **Gas**: Always ensure you have native gas tokens on source chain
3. **Unified Balance**: Deposit once, transfer many times - leverage the instant transfers
4. **Redundancy**: Fund from multiple chains for production resilience
5. **Monitoring**: Use the API endpoints to track balances across all chains

## Resources

- **Circle Gateway Docs**: https://developers.circle.com/gateway
- **Circle Testnet Faucet**: https://faucet.circle.com
- **Arc Network Docs**: https://developers.circle.com/arc
- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Arbitrum Sepolia Explorer**: https://sepolia.arbiscan.io
- **Polygon Amoy Explorer**: https://amoy.polygonscan.com
- **Avalanche Fuji Explorer**: https://testnet.snowtrace.io
- **Arc Testnet Explorer**: https://testnet.arcscan.app

## Summary

Multi-chain Gateway support provides:

✅ **Flexibility**: Fund treasury from 5+ different chains
✅ **Speed**: Instant transfers after initial finality
✅ **Unified Balance**: One balance accessible from all chains
✅ **Resilience**: Multiple funding sources for redundancy
✅ **Simplicity**: Same workflow, just change `SOURCE_CHAIN`

Your treasury is now truly multi-chain! 🚀
