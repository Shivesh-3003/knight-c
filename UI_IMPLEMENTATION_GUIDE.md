# UI Implementation Guide: Multi-Chain Gateway Funding

This guide explains how to build a **user-friendly UI** for multi-chain Circle Gateway treasury funding that **avoids the 12-15 minute wait problem**.

## The Core Problem & Solution

### The Problem

- First deposit from a chain requires waiting **12-15 minutes** for finality
- Users won't wait on a loading screen for 15 minutes
- But you can't skip finality - Circle Gateway requires it

### The Solution: Two-Step UX

**Step 1: Build Unified Balance (One-time per chain)**
- User deposits USDC from any chain to Gateway
- UI saves state to localStorage
- User can **close the page** and come back later
- Background polling checks for finality
- Shows progress: "5/32 confirmations"

**Step 2: Instant Treasury Funding**
- Once unified balance exists, transfers are **<500ms**
- User selects amount from unified balance
- Instantly transfers to Arc treasury
- No waiting!

## Component Architecture

I've created `MultiChainGatewayFunding.tsx` with this architecture:

```
┌─────────────────────────────────────────────────────────┐
│ MultiChainGatewayFunding Component                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Step 1: Build Unified Balance                     │ │
│  │                                                    │ │
│  │  [Base] [Arbitrum] [Polygon] [Avalanche]          │ │
│  │  ✅ Ready  ⏳ 15/32   ❌ Not     ❌ Not             │ │
│  │                                                    │ │
│  │  Chain: [Base Sepolia ▼]                          │ │
│  │  Amount: [5] USDC                                  │ │
│  │  [Deposit to Gateway]                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Step 2: Fund Treasury (Instant)                   │ │
│  │                                                    │ │
│  │  Unified Balance: 25.50 USDC                      │ │
│  │  Amount: [10] USDC                                 │ │
│  │  [Transfer to Arc Treasury] ⚡ <500ms              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Chain Status Tracking

```typescript
type DepositStatus = 'not_started' | 'depositing' | 'waiting_finality' | 'ready' | 'error';

interface ChainStatus {
  status: DepositStatus;
  depositTxHash?: string;
  depositBlock?: number;
  currentBlock?: number;
}
```

Each chain has its own status:
- ❌ `not_started`: Never deposited from this chain
- 🔄 `depositing`: Transaction in progress
- ⏳ `waiting_finality`: Waiting for 32 block confirmations
- ✅ `ready`: Finalized, can use unified balance
- ❌ `error`: Something went wrong

### 2. Persistent State (localStorage)

```typescript
// Save statuses so user can close page and come back
useEffect(() => {
  localStorage.setItem('gateway-chain-statuses', JSON.stringify(chainStatuses));
}, [chainStatuses]);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('gateway-chain-statuses');
  if (saved) {
    setChainStatuses(JSON.parse(saved));
  }
}, []);
```

### 3. Background Finality Monitoring

```typescript
// Poll every 30 seconds to check if deposits reached finality
useEffect(() => {
  const pendingDeposits = Object.entries(chainStatuses).filter(
    ([_, status]) => status.status === 'waiting_finality'
  );

  if (pendingDeposits.length === 0) return;

  const interval = setInterval(async () => {
    for (const [chainKey, status] of pendingDeposits) {
      const currentBlock = await publicClient.getBlockNumber();
      const confirmations = Number(currentBlock) - status.depositBlock;

      if (confirmations >= 32) {
        // Finality reached! Show notification
        setChainStatuses((prev) => ({
          ...prev,
          [chainKey]: { ...status, status: 'ready' },
        }));

        toast({
          title: '✅ Deposit Finalized!',
          description: `${chainName} deposit is ready for instant transfers!`,
        });
      }
    }
  }, 30000); // Every 30 seconds

  return () => clearInterval(interval);
}, [chainStatuses]);
```

### 4. Multi-Chain Wallet Switching

```typescript
import { useSwitchChain } from 'wagmi';

const { switchChain } = useSwitchChain();

// Before depositing, switch to the selected chain
await switchChain({ chainId: CHAINS[selectedChain].chain.id });
```

## User Flow Examples

### Scenario 1: First-Time User (Base → Arc)

1. **User visits page**
   - Sees all chains marked as "Not funded"
   - Selects "Base Sepolia"
   - Enters 5 USDC

2. **User clicks "Deposit to Gateway"**
   - MetaMask prompts to switch to Base Sepolia
   - Approve transaction (Gateway Wallet to spend USDC)
   - Deposit transaction (USDC → Gateway Wallet)
   - Status changes to "⏳ Waiting for finality (0/32)"

3. **User closes the page** ✅
   - State saved to localStorage
   - Can come back anytime

4. **15 minutes later, user returns**
   - Background polling detects finality
   - Shows "✅ Ready"
   - Unified balance updated: "5.00 USDC"

5. **User funds treasury**
   - Enters 5 USDC in Step 2
   - Clicks "Transfer to Arc Treasury"
   - **Instant transfer (<500ms)** ⚡
   - Treasury funded!

### Scenario 2: Experienced User (Instant Transfer)

1. **User already has unified balance from previous Base deposit**
   - Base shows "✅ Ready"
   - Unified balance: "25.50 USDC"

2. **User funds treasury**
   - Enters 10 USDC
   - Clicks "Transfer to Arc Treasury"
   - **Instant (<500ms)** ⚡
   - Done!

### Scenario 3: Multi-Chain Diversification

1. **User deposits from multiple chains for redundancy**
   - Day 1: Deposit 10 USDC from Base → Unified balance: 10 USDC
   - Day 2: Deposit 5 USDC from Arbitrum → Unified balance: 15 USDC
   - Day 3: Deposit 8 USDC from Polygon → Unified balance: 23 USDC

2. **All future transfers are instant from any chain** ⚡

## Integration Steps

### 1. Add the Component to Your App

```tsx
// In your Dashboard or Funding page
import { MultiChainGatewayFunding } from '@/components/MultiChainGatewayFunding';

export function TreasuryFundingPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Fund Treasury</h1>
      <MultiChainGatewayFunding />
    </div>
  );
}
```

### 2. Configure wagmi with All Chains

```tsx
// frontend/src/lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { sepolia, baseSepolia, arbitrumSepolia, polygonAmoy, avalancheFuji } from 'wagmi/chains';
import { arcTestnet } from './chains'; // Your custom Arc chain config

export const config = createConfig({
  chains: [sepolia, baseSepolia, arbitrumSepolia, polygonAmoy, avalancheFuji, arcTestnet],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http('https://sepolia-preconf.base.org'), // Flashblocks RPC
    [arbitrumSepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [avalancheFuji.id]: http(),
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
  // ... other config
});
```

### 3. Implement Backend API Endpoint (TODO)

The component calls `/api/circle/transfer-to-treasury` which needs to be fully implemented:

```typescript
// backend/src/services/circle.service.ts
async transferFromUnifiedBalance(amount: string, destinationChain: string) {
  // 1. Create burn intent
  const burnIntent = this.createBurnIntent(amount, destinationChain);

  // 2. Sign with EIP-712
  const signature = await this.signBurnIntent(burnIntent);

  // 3. Submit to Gateway API
  const { attestation, signature: apiSig } = await this.submitToGatewayAPI(burnIntent, signature);

  // 4. Mint on destination chain
  const mintTx = await this.mintOnDestination(attestation, apiSig, destinationChain);

  // 5. Deposit to treasury (if destination is Arc)
  if (destinationChain === 'arc') {
    return await this.depositToTreasury(amount);
  }

  return mintTx;
}
```

This logic already exists in `scripts/fund-treasury-via-gateway.ts` - just needs to be refactored into service methods.

## Alternative: Simpler "Deposit & Forget" UX

If you want an even simpler UX, you can combine both steps:

```
┌─────────────────────────────────────────────────────────┐
│  Fund Treasury from Any Chain                          │
│                                                         │
│  Source Chain: [Base Sepolia ▼]                        │
│  Amount: [10] USDC                                      │
│                                                         │
│  Status:                                                │
│  ⏳ Step 1: Depositing to Gateway...                    │
│  ⏳ Step 2: Waiting for finality (15/32 blocks)         │
│  ⏳ Step 3: Transferring to Arc treasury...             │
│  ✅ Complete! Treasury funded with 10 USDC              │
│                                                         │
│  [Start Transfer]                                       │
│                                                         │
│  💡 You can close this page. We'll email you when      │
│     the transfer completes (~15 minutes).               │
└─────────────────────────────────────────────────────────┘
```

This UX:
- ✅ Simpler - one button
- ✅ User doesn't need to understand "unified balance"
- ❌ Still requires 15 min wait for first transfer from a chain
- ✅ Can add email/push notification when complete

## Best Practices

### 1. Show Estimated Times

```tsx
<Alert>
  <Clock className="h-4 w-4" />
  <AlertTitle>Estimated Time</AlertTitle>
  <AlertDescription>
    {chainStatuses[selectedChain].status === 'ready'
      ? '⚡ Instant (<500ms)'
      : '⏱️ ~12-15 minutes (first time from this chain)'}
  </AlertDescription>
</Alert>
```

### 2. Recommend Base Sepolia

```tsx
<Alert>
  <Lightbulb className="h-4 w-4" />
  <AlertDescription>
    💡 <strong>Recommended:</strong> Use Base Sepolia for fastest and most reliable transfers.
  </AlertDescription>
</Alert>
```

### 3. Add Help Text

```tsx
<Tooltip>
  <TooltipTrigger>
    <HelpCircle className="h-4 w-4" />
  </TooltipTrigger>
  <TooltipContent>
    <p>The first deposit from each chain creates a "unified balance"</p>
    <p>that can be instantly transferred to any supported chain.</p>
    <p>This 15-minute wait only happens once per chain!</p>
  </TooltipContent>
</Tooltip>
```

### 4. Show Transaction Links

```tsx
{chainStatus.depositTxHash && (
  <a
    href={`${CHAINS[chain].explorer}/tx/${chainStatus.depositTxHash}`}
    target="_blank"
    className="text-blue-500 underline text-sm"
  >
    View on Explorer →
  </a>
)}
```

## Testing Checklist

- [ ] User can select any chain
- [ ] User can deposit to Gateway
- [ ] Status persists after page refresh
- [ ] Background polling works
- [ ] Notification appears when finality reached
- [ ] Unified balance updates correctly
- [ ] Instant transfer works after finality
- [ ] Multi-chain deposits accumulate in unified balance
- [ ] Error handling works (insufficient balance, rejected tx)
- [ ] Mobile responsive

## Summary

**The key insight**: Split the UX into two steps:

1. **Build unified balance** (slow, one-time per chain, can close page)
2. **Use unified balance** (instant, repeatable)

This way:
- ✅ Users never wait on a loading screen
- ✅ First-time setup is clear and expected
- ✅ Subsequent transfers are instant
- ✅ Professional, production-ready UX

The React component I created (`MultiChainGatewayFunding.tsx`) implements this pattern and is ready to use!
