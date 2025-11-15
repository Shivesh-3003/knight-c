# Circle Gateway Implementation Correction Summary

## Problem Diagnosis

Your implementation was **mixing Circle Gateway with CCTP** (Cross-Chain Transfer Protocol), which are **two completely different systems** from Circle.

### What Was Wrong

1. **Incorrect API Endpoint**
   - ❌ Used: `https://api.circle.com/v1/w3s/transfers/{txHash}` (CCTP endpoint)
   - ✅ Should use: `https://gateway-api-testnet.circle.com/v1/transfer` (Gateway endpoint)

2. **Incorrect Contract Method**
   - ❌ Used: `receiveMessage(message, attestation)` (CCTP method)
   - ✅ Should use: `gatewayMint(attestation, signature)` (Gateway method)

3. **Missing Burn Intent Workflow**
   - ❌ Tried to fetch attestation directly after deposit
   - ✅ Need to create and sign EIP-712 BurnIntent, then submit to API

4. **Incorrect Understanding of Flow**
   - ❌ Thought: Deposit → Wait → Fetch attestation → Mint
   - ✅ Actually: Deposit → Wait → Sign burn intent → API call → Mint

## The Differences: Gateway vs CCTP

| Feature | Circle Gateway | CCTP (Cross-Chain Transfer) |
|---------|---------------|----------------------------|
| **Purpose** | Unified USDC balance across chains | Direct burn-and-mint between chains |
| **Flow** | Deposit → Unified balance → Burn intent → Mint | Burn on source → Attestation → Mint on dest |
| **API** | `gateway-api-testnet.circle.com` | `iris-api.circle.com` |
| **Minter Method** | `gatewayMint(attestation, signature)` | `receiveMessage(message, attestation)` |
| **Requires API Key** | No | No |
| **Speed** | Instant after first deposit finality | Requires finality per transfer |
| **Key Advantage** | Front-load the wait time | Simpler, direct transfers |

## What Was Fixed

### 1. **scripts/fund-treasury-via-gateway.ts**

**Before:**
```typescript
// Step 2: Fetch attestation using W3S API
const apiUrl = `https://api.circle.com/v1/w3s/transfers/${depositHash}`;
// Step 3: Call receiveMessage
await arcWallet.writeContract({
  functionName: 'receiveMessage',
  args: [data.message, data.attestation]
});
```

**After:**
```typescript
// Step 2: Wait for finality
// Step 3: Create and sign BurnIntent with EIP-712
const burnIntentTypedData = createBurnIntentTypedData(account.address, amount);
const signature = await account.signTypedData(burnIntentTypedData);

// Step 4: Submit to Gateway API
const response = await fetch('https://gateway-api-testnet.circle.com/v1/transfer', {
  method: 'POST',
  body: JSON.stringify([{ burnIntent: burnIntentTypedData.message, signature }])
});

// Step 5: Call gatewayMint
await arcWallet.writeContract({
  functionName: 'gatewayMint',
  args: [result.attestation, result.signature]
});
```

### 2. **backend/src/services/circle.service.ts**

- Updated `gatewayMinterAbi` from `receiveMessage` to `gatewayMint`
- Deprecated `getGatewayAttestation()` method (CCTP approach doesn't work for Gateway)
- Updated `mintOnArc()` signature to accept `(attestation, signature)` instead of `(message, attestation)`

### 3. **CLAUDE.md Documentation**

- Added section distinguishing Gateway vs CCTP
- Corrected the manual workflow steps
- Added domain IDs: Sepolia = 0, Arc = 26
- Clarified that Gateway doesn't need CIRCLE_API_KEY
- Added correct API endpoint
- Updated data flow diagram

## Key Technical Details

### Gateway Domain IDs
- **Sepolia (Ethereum testnet)**: Domain 0
- **Arc Testnet**: Domain 26
- **Base Sepolia**: Domain 6
- **Avalanche Fuji**: Domain 1

### EIP-712 BurnIntent Structure
```typescript
{
  maxBlockHeight: uint256,  // Max uint256 for 7+ days
  maxFee: uint256,          // e.g., 2_010000 (~2.01 USDC)
  spec: {
    version: 1,
    sourceDomain: 0,        // Sepolia
    destinationDomain: 26,  // Arc Testnet
    sourceContract: bytes32, // Gateway Wallet
    destinationContract: bytes32, // Gateway Minter
    sourceToken: bytes32,
    destinationToken: bytes32,
    sourceDepositor: bytes32,
    destinationRecipient: bytes32,
    sourceSigner: bytes32,
    destinationCaller: bytes32,
    value: uint256,
    salt: bytes32,          // Random
    hookData: bytes
  }
}
```

### Correct Contract Addresses (Verified)

These are **NOT mocked** - they are the real Circle Gateway testnet contracts:

- **Gateway Wallet**: `0x0077777d7EBA4688BDeF3E311b846F25870A19B9` (same on all testnets)
- **Gateway Minter**: `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B` (same on all testnets)
- **Sepolia USDC**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- **Arc USDC**: `0x3600000000000000000000000000000000000000`

## Why Your USDC Was Stuck

Your USDC was successfully deposited to the Gateway Wallet on Sepolia, creating a unified balance. However:

1. You tried to fetch an attestation using the CCTP/W3S API endpoint
2. This endpoint doesn't know about Gateway deposits (different system)
3. Without creating a burn intent, the Gateway system never received a request to mint on Arc
4. Your USDC is sitting in the unified balance, waiting for a burn intent

## How to Recover (If You Already Deposited)

If you already deposited USDC to Gateway Wallet on Sepolia:

1. Wait for finality (32 blocks, ~12-15 minutes from deposit time)
2. Run the corrected script: `ts-node scripts/fund-treasury-via-gateway.ts`
3. Skip the deposit step if you want (or deposit more)
4. The script will create a burn intent for your unified balance
5. USDC will be minted on Arc

Alternatively, you can create a separate script to just do the burn intent → mint flow if you don't want to deposit again.

## Testing the Corrected Implementation

```bash
# 1. Ensure you have USDC on Sepolia
# Get from: https://faucet.circle.com

# 2. Ensure .env is configured
# PRIVATE_KEY=your_private_key
# TREASURY_CONTRACT_ADDRESS=your_treasury_address

# 3. Run the corrected script
ts-node scripts/fund-treasury-via-gateway.ts

# The script will:
# - Deposit to Gateway Wallet (unified balance)
# - Wait for 32 block confirmations
# - Create and sign BurnIntent
# - Submit to Gateway API
# - Mint on Arc
# - Deposit to Treasury
```

## References

- **Circle Gateway Docs**: https://developers.circle.com/gateway
- **Gateway Quickstart**: https://developers.circle.com/gateway/quickstarts/unified-balance
- **Arc Network Docs**: https://developers.circle.com/arc
- **Sepolia Faucet**: https://faucet.circle.com
- **Arc Block Explorer**: https://testnet.arcscan.app

## Summary

Your contract addresses were **correct**, but the implementation was using **CCTP's workflow instead of Gateway's workflow**. The corrected implementation now:

1. ✅ Creates a unified USDC balance via Gateway deposit
2. ✅ Uses EIP-712 to sign burn intents
3. ✅ Calls the correct Gateway API endpoint
4. ✅ Uses `gatewayMint()` instead of `receiveMessage()`
5. ✅ Properly handles domain IDs for Sepolia and Arc

The USDC stuck on Sepolia is in your unified balance and can be accessed by creating a burn intent for Arc.
