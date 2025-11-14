# Knight-C: TIER 1 vs Roadmap

This document clarifies what has been **built and deployed** for the hackathon (TIER 1) versus what is **planned for the future** (Roadmap).

## TIER 1: Built for Hackathon ✅

These features are **fully functional smart contracts deployed on Arc**:

### 1. One Unified Global Treasury
- ✅ Smart contract wallet (`Treasury.sol`)
- ✅ Real-time visibility via blockchain state
- ✅ Single dashboard showing all funds
- **Demo**: Act 1 - CFO funds treasury via Circle Gateway

### 2. Instant Global Settlement
- ✅ Sub-second finality (Arc's 0.4s blocks)
- ✅ ~one cent gas fees in USDC
- ✅ Cross-border payments without SWIFT
- **Demo**: Act 2 - $80K payment to São Paulo in <1 second

### 3. Automated Budget Enforcement ⭐ (HERO FEATURE)
- ✅ On-chain budget limits in `Pot.sol`
- ✅ Smart contract enforces spending caps
- ✅ Mathematical impossibility of overspending
- ✅ Real-time budget checks before every transaction
- **Demo**: Act 4 - Marketing blocked from overspending, CFO reallocates funds

### 4. Smart Contract Fraud Prevention
- ✅ Multi-signature approval workflows
- ✅ Beneficiary whitelist enforcement
- ✅ On-chain approval thresholds (e.g., >$100K requires CFO)
- **Demo**: Act 3 - 50-employee payroll requires CFO approval

### 5. Batch Payment Execution
- ✅ Execute multiple payments in single transaction
- ✅ Payroll for 50 employees via smart contract
- ✅ Gas cost optimization
- **Demo**: Act 3 - Batch payroll execution

### 6. Departmental Pots (Budget Allocation)
- ✅ Smart contract sub-accounts
- ✅ Individual budget tracking
- ✅ Reallocation between Pots
- **Demo**: Act 1 - Create Engineering ($2M), Marketing ($500K), Operations ($750K)

## TIER 2: Mocked UI (For Demo Purposes)

These features have **UI mockups** but are not yet implemented on-chain:

### 1. Scheduled Flows (Automated Recurring Payments)
- ⚠️ UI shows configured flows
- ⚠️ Not yet integrated with keeper network (Chainlink Automation)
- **Roadmap**: Full automation with Chainlink Keepers
- **Demo**: Act 5 - Show mock UI of recurring payments

### 2. Instant Compliance Reports
- ⚠️ UI shows audit report generation
- ⚠️ On-chain data is available but PDF generation is mocked
- **Roadmap**: Full query and export functionality
- **Demo**: Act 6 - Mock 5-second report generation

## ROADMAP: Future Features 🚀

These are **planned features** for post-hackathon development:

### 1. Configurable Privacy (Dependent on Arc Roadmap)
**Status**: Waiting for Arc's Privacy Module

When Arc's planned Privacy Module launches:
- 🔮 Public Pots for transparency (Marketing, Operations)
- 🔮 Private Pots for confidentiality (Engineering payroll)
- 🔮 View keys for CFO access to private data
- 🔮 Compliance-friendly selective disclosure

**Current State**: All transactions are currently **public** on Arc
- We can see all amounts, recipients, and purposes
- This is acceptable for the hackathon demo
- Privacy is a critical enterprise requirement for production

**Demo**: Act 7 - Vision slide showing future "Private Pot" mockup

### 2. SalaryShield (Temporal Jitter Privacy)
**Status**: Planned proprietary innovation

Defense-in-depth privacy for payroll:
- 🔮 Randomized execution delays (50-200ms per payment)
- 🔮 Prevents timing analysis
- 🔮 Layered on top of Arc's privacy
- 🔮 Military-grade confidentiality

**Current State**: Code structure exists in `Pot.sol` but not activated
- `executePayrollWithJitter()` function is placeholder
- Will activate when Arc Privacy Module is available

### 3. Time-Locks & RBAC
- 🔮 24-hour time-lock for new beneficiary additions
- 🔮 Full Role-Based Access Control system
- 🔮 Granular permissions per department

### 4. Circle Yield Integration
- 🔮 Automatically sweep idle funds into Circle Yield (USYC)
- 🔮 Earn ~4% APY on unallocated treasury reserves
- 🔮 Turn treasury from cost center to profit center

### 5. Advanced Analytics
- 🔮 Spending pattern analysis
- 🔮 Budget forecasting
- 🔮 Departmental comparisons
- 🔮 Burn rate calculations

## Why This Tiered Approach?

### TIER 1 Solves Immediate Pain Points
The biggest corporate treasury problems **today**:
1. ❌ Budget overruns (no enforcement) → ✅ TIER 1 solves with on-chain limits
2. ❌ Slow cross-border payments → ✅ TIER 1 solves with Arc's sub-second finality
3. ❌ Email-based fraud → ✅ TIER 1 solves with smart contract multi-sig
4. ❌ No real-time visibility → ✅ TIER 1 solves with blockchain state

### Roadmap Addresses Enterprise Requirements
For Fortune 500 adoption, we need:
- 🔮 Privacy (Arc's upcoming Privacy Module)
- 🔮 Automation (Keeper network integration)
- 🔮 Yield optimization (Circle Yield integration)

## Technical Implementation Status

### Smart Contracts (TIER 1)
```
Treasury.sol         ✅ Deployed
Pot.sol             ✅ Deployed
Flow.sol            ✅ Deployed (core functions)
Privacy.sol         ⚠️ Placeholder (awaiting Arc Privacy Module)
```

### Frontend (TIER 1 + Mocked TIER 2)
```
Dashboard           ✅ Functional
Pots Management     ✅ Functional
Payment Execution   ✅ Functional
Budget Enforcement  ✅ Functional
Scheduled Flows     ⚠️ UI only (no keeper integration)
Audit Reports       ⚠️ UI only (no PDF export)
Privacy Settings    🔮 Roadmap (shows vision mockup)
```

## Demo Strategy

Our 9-minute demo is structured to show:

**Minutes 1-6**: What Works Today (TIER 1)
- Act 1-4: Live, functional smart contract interactions
- Real transactions on Arc
- Actual budget enforcement
- Working multi-sig

**Minutes 7-8**: What's Coming Soon (TIER 2 + Roadmap)
- Act 5-6: Mocked UI showing automation potential
- Act 7: Vision slide for privacy features

**Minute 9**: The Big Picture
- How TIER 1 solves immediate problems
- How Roadmap delivers enterprise-grade solution

## For Judges

**What you can test live:**
- ✅ Create Pots with budgets
- ✅ Execute payments with sub-second finality
- ✅ Budget enforcement (try to overspend, watch it fail)
- ✅ Multi-sig approvals
- ✅ Batch payroll execution

**What is mocked for vision:**
- ⚠️ Automated scheduling (keeper integration pending)
- ⚠️ PDF audit exports (on-chain data exists, export pending)
- 🔮 Privacy features (dependent on Arc's roadmap)

## Conclusion

Knight-C is a **real, working TIER 1 treasury platform** that solves corporate treasuries' most painful problems today using Arc's actual strengths (sub-second finality, USDC gas).

Our Roadmap features (privacy, full automation, yield optimization) will make Knight-C **enterprise-ready for Fortune 500 adoption**, and we're building in lockstep with Arc's own roadmap.

**Built today. Vision for tomorrow. All on Arc.**
