# Circle Developer Documentation (Consolidated)

This document combines all the provided documentation from the `circle-docs` folder into a single file.

# 1. Circle Developer Documentation (README)

Comprehensive documentation for building on the Circle platform with USDC, EURC, and related services.

## About Circle

Circle is a global financial technology company that enables businesses of all sizes to harness the power of stablecoins and public blockchains for payments, commerce, and financial applications.

## Products & Services

### Stablecoins

Regulated digital currencies issued on blockchains supported by global banks:

- **USDC** - Dollar-backed stablecoin with 1:1 reserves
    
- **EURC** - Euro-backed stablecoin with 1:1 reserves
    

### Circle Payments Network

Next-generation payment infrastructure for global money movement.

### Developer Services

Enterprise-grade smart contracts, APIs, and SDKs to power apps with stablecoins:

- **User-Controlled Wallets** - Web3 wallets with PIN-based security
    
- **Developer-Controlled Wallets** - Programmatic wallet management
    
- **Modular Wallets** - Advanced wallet infrastructure with account abstraction
    

### Cross-Chain Transfer Protocol (CCTP)

Permissionless onchain utility for native USDC transfers between blockchains via burning and minting.

### Gateway

Unified USDC balance instantly accessible across multiple blockchains.

### Circle Mint

Fast and cost-effective USDC and EURC minting and redemption for qualified businesses.

### Liquidity Services

Institutional minting, redemption, and FX services for stablecoins.

## Quick Links

### Getting Started

- [USDC Quickstart](https://www.google.com/search?q=./quickstarts/usdc-quickstart.md "null") - Transfer USDC on blockchain
    
- [CCTP Quickstart](https://www.google.com/search?q=./quickstarts/cctp-quickstart.md "null") - Cross-chain USDC transfers
    
- [Gateway Quickstart](https://www.google.com/search?q=./quickstarts/gateway-quickstart.md "null") - Unified USDC balance
    
- [Wallets Quickstart](https://www.google.com/search?q=./quickstarts/wallets-quickstart.md "null") - User-controlled wallets
    

### Core Documentation

- [Stablecoins](https://www.google.com/search?q=./stablecoins/ "null") - USDC and EURC documentation
    
- [CCTP](https://www.google.com/search?q=./cctp/ "null") - Cross-Chain Transfer Protocol
    
- [Gateway](https://www.google.com/search?q=./gateway/ "null") - Unified crosschain USDC
    
- [Wallets](https://www.google.com/search?q=./wallets/ "null") - Wallet solutions
    
- [Circle Mint](https://www.google.com/search?q=./circle-mint/ "null") - Minting and redemption
    

### Developer Resources

- [SDKs](https://www.google.com/search?q=./sdks/ "null") - Client and server-side SDKs
    
- [API Reference](https://www.google.com/search?q=./api-reference/ "null") - Complete API documentation
    
- [Sample Projects](https://developers.circle.com/sample-projects "null") - Open-source examples
    

### Tools & Support

- **Testnet Faucet**: https://faucet.circle.com
    
- **Token Addresses**: See stablecoins/contract-addresses.md
    
- **Console**: https://console.circle.com
    
- **Discord**: Join the Circle developer community
    
- **Blog**: https://www.circle.com/blog
    

## Key Features

### USDC & EURC

- **1:1 Backed**: Fully backed by reserve assets
    
- **Multichain**: Available on 15+ blockchains
    
- **Regulated**: Compliant with global standards including MiCA
    
- **Transparent**: Monthly attestation reports
    
- **Programmable**: Build custom financial applications
    

### CCTP (Cross-Chain Transfer Protocol)

- **Native Burning and Minting**: No synthetic or wrapped tokens
    
- **Permissionless**: Open to all developers
    
- **Fast & Standard Transfers**: Choose between speed and cost
    
- **Capital Efficient**: Unified liquidity across chains
    
- **Composable**: Extend with custom logic
    

### Gateway

- **Instant Transfers**: Next-block access to funds
    
- **Chain Abstraction**: Single balance across multiple chains
    
- **Non-Custodial**: Users maintain full control
    
- **Capital Efficient**: Front-load finalization time
    
- **Low Latency**: Optimized for fast transfers
    

### Wallets

- **User-Controlled**: PIN-based security, social recovery
    
- **Developer-Controlled**: Full programmatic control
    
- **Account Abstraction**: Gasless transactions, session keys
    
- **Multichain**: Consistent addresses across EVM chains
    
- **Compliant**: Built-in compliance features
    

## Supported Blockchains

### Mainnet

- Ethereum
    
- Polygon PoS
    
- Avalanche
    
- Arbitrum
    
- Optimism (OP Mainnet)
    
- Base
    
- Solana
    
- NEAR
    
- Noble (Cosmos)
    
- Sui
    
- Aptos
    
- Unichain
    
- Arc (Coming soon)
    

### Testnet

- Ethereum Sepolia
    
- Polygon Amoy
    
- Avalanche Fuji
    
- Arbitrum Sepolia
    
- OP Sepolia
    
- Base Sepolia
    
- Solana Devnet
    
- NEAR Testnet
    
- Noble Testnet
    
- Sui Testnet
    
- Aptos Testnet
    
- Arc Testnet
    

## Use Cases

### Payments & Commerce

- Cross-border payments and remittances
    
- Marketplace payouts
    
- Subscription payments
    
- Merchant acceptance
    

### DeFi

- Lending and borrowing
    
- DEX liquidity
    
- Yield farming
    
- Stablecoin swaps
    

### Gaming & NFTs

- In-game currencies
    
- NFT marketplaces
    
- Prize payouts
    
- Creator monetization
    

### Capital Markets

- Tokenized securities
    
- Settlement and clearing
    
- Collateral management
    
- Treasury management
    

### Agentic Commerce

- AI-mediated marketplaces
    
- Machine-to-machine payments
    
- Autonomous transactions
    
- IoT payment networks
    

## Getting Help

- **Documentation**: https://developers.circle.com
    
- **API Status**: https://status.circle.com
    
- **Support**: support@circle.com
    
- **Discord**: Join the developer community
    
- **GitHub**: https://github.com/circlefin
    

## Developer Grants & Credits

- **Developer Grants**: Funding for projects leveraging USDC
    
- **Circle Credits**: Lower costs for building onchain apps
    
- **Circle Research**: Open-source contributions
    

## License & Terms

By using Circle's services, you agree to Circle's Terms of Service and Privacy Policy. Always refer to official documentation at https://developers.circle.com for the most up-to-date information.

Documentation compiled on: November 14, 2025

Source: https://developers.circle.com

# 2. USDC Overview

USDC (USD Coin) is a fully backed dollar stablecoin that operates on multiple leading public blockchains. USDC is always redeemable 1:1 for US dollars.

## What is USDC?

USDC is a digital dollar issued by Circle, also known as a stablecoin. Designed to represent US dollars on the internet, USDC is backed 100% by highly liquid cash and cash-equivalent assets so that it's always redeemable 1:1 for USD.

Circle publishes monthly attestation reports for USDC reserve holdings on Circle's Transparency page.

## Key Features

### 1:1 USD Backed

- Every USDC is backed by $1 held in reserve
    
- Reserves consist of cash and short-duration US treasuries
    
- Monthly attestation reports from independent auditors
    

### Multichain Support

USDC operates natively on 15+ blockchains:

- Ethereum
    
- Polygon PoS
    
- Avalanche
    
- Arbitrum
    
- Optimism (OP Mainnet)
    
- Base
    
- Solana
    
- NEAR
    
- Noble (Cosmos ecosystem)
    
- Sui
    
- Aptos
    
- And more...
    

### Programmable Money

- Deploy smart contracts that interact with USDC
    
- Build custom payment flows
    
- Create DeFi applications
    
- Enable automated treasury management
    

### Fast Settlement

- Near-instant onchain settlement
    
- 24/7/365 availability
    
- Global accessibility
    

### Transparent & Regulated

- Subject to US money transmission laws
    
- Monthly reserve attestations
    
- Transparent on public blockchains
    

## How USDC Works

### Token Contract

USDC is powered by a token contract - a programmable piece of code that manages user balances autonomously across a decentralized network. As transactions occur, the token contract automatically updates the digital ledger, ensuring real-time tracking of funds.

### Minting & Burning

- **Minting**: When USD is deposited, new USDC is created onchain
    
- **Burning**: When USDC is redeemed, tokens are destroyed and USD is returned
    
- This ensures USDC supply always matches dollar reserves
    

## Getting Started with USDC

### For Users

1. Get a digital wallet (MetaMask, Phantom, etc.)
    
2. Acquire USDC through:
    
    - Cryptocurrency exchanges
        
    - Circle Mint (for qualified businesses)
        
    - On-ramps and payment services
        
    - Peer-to-peer transfers
        
3. Send, receive, and store USDC in your wallet
    

### For Developers

1. Choose your blockchain and get testnet tokens
    
2. Get testnet USDC from Circle Faucet
    
3. Integrate USDC smart contract in your application
    
4. Use Circle's APIs and SDKs to build
    

## USDC Contract Addresses

USDC has different contract addresses on each blockchain. Always verify you're using the correct contract address for your target chain.

### Mainnet Addresses (Examples)

- **Ethereum**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
    
- **Polygon**: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
    
- **Avalanche**: `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`
    
- **Arbitrum**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
    
- **Base**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
    
- **Solana**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
    

### Testnet Addresses (Examples)

- **Ethereum Sepolia**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
    
- **Polygon Amoy**: `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`
    
- **Avalanche Fuji**: `0x5425890298aed601595a70AB815c96711a31Bc65`
    
- **Solana Devnet**: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
    

For complete list, see [Stablecoin Contract Addresses](https://www.google.com/search?q=%23stablecoin-contract-addresses "null") section below.

## USDC Use Cases

### Payments

- **Cross-border payments**: Send money globally in seconds
    
- **Merchant payments**: Accept stablecoin payments
    
- **Payroll**: Pay contractors and employees in USDC
    
- **Remittances**: Low-cost international money transfer
    

### DeFi

- **Lending & Borrowing**: Use USDC as collateral
    
- **Liquidity Provision**: Provide USDC to DEXs
    
- **Yield Generation**: Earn interest on USDC
    
- **Trading**: Trade against crypto assets
    

### Commerce

- **E-commerce**: Accept USDC payments
    
- **Subscription Services**: Recurring USDC payments
    
- **Marketplace Payouts**: Distribute earnings in USDC
    
- **Gaming**: In-game currency and rewards
    

### Treasury Management

- **Corporate Treasury**: Hold digital dollars
    
- **Working Capital**: Manage cash flow onchain
    
- **Reserves**: Store value in stablecoins
    
- **FX**: Multi-currency operations with EURC
    

## Technical Specifications

### Token Standard

- **EVM chains**: ERC-20
    
- **Solana**: SPL Token
    
- **Other chains**: Native implementations
    

### Decimals

- **Most EVM chains**: 6 decimals
    
- **Solana**: 6 decimals
    
- **Note**: Arc Testnet uses 18 decimals for native gas, but USDC ERC-20 interface uses 6
    

### Key Functions

```
// ERC-20 Interface
function transfer(address to, uint256 amount) external returns (bool);
function approve(address spender, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);
function balanceOf(address account) external view returns (uint256);
function allowance(address owner, address spender) external view returns (uint256);
```

## Resources

### Tools

- **Faucet**: https://faucet.circle.com (testnet USDC)
    
- **Explorer**: View on blockchain explorers
    
- **APIs**: Circle Mint API, CCTP API, Wallets API
    

### Guides

- [Quickstart: Transfer USDC](https://www.google.com/search?q=%23quickstart-transfer-usdc "null")
    
- [USDC on EVM Chains](https://www.google.com/search?q=./usdc-evm-quickstart.md "null")
    
- [USDC on Solana](https://www.google.com/search?q=./usdc-solana-quickstart.md "null")
    
- [USDC with CCTP](https://www.google.com/search?q=%23cctp-cross-chain-transfer-protocol "null")
    

### Documentation

- [Supported Chains](https://www.google.com/search?q=./supported-chains.md "null")
    
- [Contract Addresses](https://www.google.com/search?q=%23stablecoin-contract-addresses "null")
    
- [API Reference](https://www.google.com/search?q=../api-reference/README.md "null")
    

## Testnet vs Production

### Testnet

- **Purpose**: Testing and development only
    
- **Value**: No real-world value
    
- **Faucet**: Free testnet USDC available
    
- **Networks**: Sepolia, Fuji, Amoy, Devnet, etc.
    

### Production (Mainnet)

- **Purpose**: Real-world transactions
    
- **Value**: Each USDC = $1 USD
    
- **Acquisition**: Exchanges, Circle Mint, on-ramps
    
- **Security**: Use hardware wallets, verify addresses
    

## Security Best Practices

1. **Verify Contract Addresses**: Always double-check USDC contract addresses
    
2. **Test First**: Use testnet before mainnet deployment
    
3. **Audit Code**: Security audit smart contracts that interact with USDC
    
4. **Secure Keys**: Use hardware wallets and MPC for production
    
5. **Monitor Transactions**: Set up alerts for large transfers
    
6. **Use Official Sources**: Only trust addresses from Circle's official documentation
    

## FAQs

Q: Is USDC the same across all blockchains?

A: Yes, USDC maintains 1:1 value across all chains, but each chain has a separate contract.

Q: How do I move USDC between chains?

A: Use CCTP (Circle's Cross-Chain Transfer Protocol) or Circle Gateway for native transfers.

Q: What's the difference between USDC and bridged USDC?

A: Native USDC is issued directly by Circle. Bridged versions are wrapped tokens from third-party bridges.

Q: Can I redeem USDC for USD?

A: Qualified businesses can redeem through Circle Mint. Individuals typically use exchanges.

Q: Where can I see USDC reserves?

A: Visit Circle's transparency page for monthly attestation reports.

## Support

- **Documentation**: https://developers.circle.com/stablecoins
    
- **Developer Discord**: Join the community
    
- **API Support**: support@circle.com
    
- **Status Page**: https://status.circle.com
    

For the most current information and updates, always refer to the official Circle documentation at https://developers.circle.com/stablecoins.

# 3. EURC Overview

EURC (Euro Coin) is a digital euro issued by Circle that operates on several leading public blockchains. EURC is backed 100% by euro-denominated reserves and is always redeemable 1:1 for EUR.

## What is EURC?

EURC is a euro stablecoin, also known as a digital euro, designed to represent euros on the internet. Like USDC, EURC is fully backed by euro-denominated reserves held by Circle.

Circle publishes monthly attestation reports for EURC reserve holdings on Circle's Transparency page.

## Key Features

### MiCA Compliant

EURC is one of the first fully compliant stablecoins under the EU's Markets in Crypto-Assets (MiCA) regulation. This makes EURC:

- **Regulatory Compliant**: Meets EU standards
    
- **Transparent**: Regular reporting and attestations
    
- **Trustworthy**: Subject to regulatory oversight
    
- **Future-Proof**: Ready for evolving EU regulations
    

### 1:1 EUR Backed

- Every EURC is backed by €1 held in reserve
    
- Reserves consist of euro-denominated assets
    
- Monthly attestation reports from independent auditors
    
- Redeemable 1:1 for EUR through qualified channels
    

### Multichain Support

EURC operates on multiple blockchain networks:

- Ethereum
    
- Avalanche
    
- Polygon PoS
    
- Arbitrum
    
- Base
    
- Optimism (OP Mainnet)
    
- Solana
    
- And more being added
    

### Programmable Euro

- Build euro-denominated DeFi applications
    
- Create cross-border payment solutions
    
- Enable FX swaps between EURC and USDC
    
- Automate euro treasury operations
    

## Why EURC?

Circle launched EURC to bring the stability and global utility of the euro into a programmable, interoperable, and internet-native form. EURC combines the trust and compliance of the traditional financial system with the speed and composability of blockchain networks.

### Benefits

**For Businesses**

- Accept euro payments 24/7
    
- Reduce FX fees and settlement times
    
- Enable euro-denominated products
    
- Expand to EU markets
    

**For Developers**

- Build euro-native applications
    
- Create multi-currency platforms
    
- Enable instant euro settlements
    
- Integrate with existing blockchain infrastructure
    

**For Users**

- Hold euros onchain
    
- Send euros globally instantly
    
- Access DeFi with euros
    
- Low-cost euro transactions
    

## Getting Started with EURC

### For Qualified Businesses

Qualified businesses can apply for a Circle Mint account to:

- Convert euros to and from EURC with **zero fees**
    
- Get near-instant settlement
    
- Access institutional-grade infrastructure
    
- Benefit from Circle's compliance framework
    

### For Developers

#### Smart Contract Integration

Developers with smart contract experience can integrate EURC directly on mainnet or testnet:

```
// EURC Contract Interface (ERC-20)
interface IEURC {
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
```

#### API Integration

Use Circle's APIs and developer tools to integrate EURC into:

- Wallets
    
- Marketplaces
    
- Payment applications
    
- Financial services
    

### Getting Testnet EURC

Use the Circle Faucet to get free testnet EURC:

1. Visit https://faucet.circle.com
    
2. Select the testnet chain
    
3. Enter your wallet address
    
4. Request EURC
    

## EURC Contract Addresses

### Mainnet Addresses

- **Ethereum**: `0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c`
    
- **Avalanche**: `0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD`
    
- **Polygon**: Check official documentation
    
- **Base**: Check official documentation
    
- **Solana**: Check official documentation
    

### Testnet Addresses

- **Ethereum Sepolia**: Check official documentation
    
- **Avalanche Fuji**: Check official documentation
    
- **Base Sepolia**: Check official documentation
    

**Important**: Always verify contract addresses from official Circle documentation.

For the complete list, see [Stablecoin Contract Addresses](https://www.google.com/search?q=%23stablecoin-contract-addresses "null") section below.

## EURC Use Cases

### Cross-Border Payments

- **EU Remittances**: Send euros within and outside EU
    
- **International Trade**: Settle invoices in euros
    
- **Payroll**: Pay EU employees and contractors
    
- **B2B Payments**: Euro-denominated business payments
    

### DeFi Applications

- **Euro Lending**: Lend and borrow in euros
    
- **DEX Trading**: Trade EURC pairs
    
- **Liquidity Pools**: Provide euro liquidity
    
- **Yield Farming**: Earn on euro deposits
    

### FX and Multi-Currency

- **EURC/USDC Swaps**: Instant euro-dollar conversion
    
- **Multi-Currency Wallets**: Hold both EURC and USDC
    
- **Treasury Management**: Manage EUR and USD exposure
    
- **Hedging**: Use stablecoins for FX risk management
    

### European Markets

- **EU E-commerce**: Accept euro payments
    
- **EU Gaming**: Euro-based in-game economies
    
- **EU NFTs**: Price NFTs in euros
    
- **EU Subscriptions**: Recurring euro payments
    

## Technical Specifications

### Token Standard

- **EVM chains**: ERC-20 compatible
    
- **Solana**: SPL Token
    
- **Decimals**: 6 (on most chains)
    

### Key Functions

Same ERC-20 interface as USDC:

- `transfer()`
    
- `approve()`
    
- `transferFrom()`
    
- `balanceOf()`
    
- `allowance()`
    

## EURC vs USDC

|   |   |   |
|---|---|---|
|**Feature**|**EURC**|**USDC**|
|Currency|Euro (EUR)|US Dollar (USD)|
|Backing|1:1 Euro reserves|1:1 Dollar reserves|
|Regulation|MiCA compliant|US regulated|
|Use Case|Euro markets|Global, dollar-based|
|Availability|Growing|15+ chains|
|Compatibility|ERC-20, SPL|ERC-20, SPL|

## Cross-Chain EURC

### Using CCTP with EURC

Circle's Cross-Chain Transfer Protocol (CCTP) supports EURC transfers:

- Native burning and minting across chains
    
- No wrapped or synthetic tokens
    
- Unified liquidity
    
- Fast and standard transfer options
    

### Using Gateway with EURC

Circle Gateway provides instant crosschain EURC:

- Unified balance across chains
    
- Next-block access
    
- Capital efficient
    
- Low latency
    

See [CCTP - Cross-Chain Transfer Protocol](https://www.google.com/search?q=%23cctp-cross-chain-transfer-protocol "null") and [Circle Gateway Overview](https://www.google.com/search?q=%23circle-gateway-overview "null") for details.

## Compliance & Regulation

### MiCA Compliance

EURC meets the EU's Markets in Crypto-Assets regulation requirements:

- **Authorization**: Circle is authorized under MiCA
    
- **Transparency**: Regular disclosure requirements
    
- **Reserve Management**: Strict reserve requirements
    
- **Consumer Protection**: Enhanced safeguards
    

### What This Means

- **For Businesses**: Build compliant euro applications
    
- **For Users**: Enhanced protection and transparency
    
- **For Regulators**: Clear regulatory framework
    
- **For the Industry**: Sets compliance standard
    

## Resources

### Documentation

- [EURC Technical Docs](https://developers.circle.com/stablecoins/what-is-eurc "null")
    
- [MiCA Compliance](https://www.circle.com/eurc "null")
    
- [Contract Addresses](https://www.google.com/search?q=%23stablecoin-contract-addresses "null")
    
- [API Reference](https://www.google.com/search?q=../api-reference/README.md "null")
    

### Tools

- **Faucet**: https://faucet.circle.com
    
- **Circle Mint**: For qualified businesses
    
- **APIs**: Wallets, CCTP, Gateway
    

### Guides

- Transfer EURC quickstart
    
- EURC with CCTP
    
- Multi-currency applications
    
- FX swap implementations
    

## Security Best Practices

1. **Verify Addresses**: Always verify EURC contract addresses
    
2. **Test on Testnet**: Test with testnet EURC first
    
3. **Audit Smart Contracts**: Security audit before mainnet
    
4. **Secure Key Management**: Use MPC or hardware wallets
    
5. **Monitor Reserves**: Check monthly attestation reports
    

## FAQs

Q: Is EURC available on all chains where USDC is available?

A: No, EURC is available on a growing subset of USDC-supported chains. Check current availability.

Q: Can I convert EURC to USDC?

A: Yes, through DEXs, exchanges, or build custom swaps with smart contracts.

Q: Is EURC affected by euro monetary policy?

A: EURC is pegged 1:1 to EUR, so it reflects the euro's value relative to other currencies.

Q: How do I redeem EURC for euros?

A: Qualified businesses can redeem through Circle Mint. Individuals typically use exchanges.

Q: What makes EURC MiCA compliant?

A: EURC meets MiCA's requirements for reserve backing, transparency, and regulatory authorization.

## Support

- **Documentation**: https://developers.circle.com/stablecoins/what-is-eurc
    
- **Circle Mint**: Apply for business account
    
- **Developer Support**: support@circle.com
    
- **Community**: Join Circle's Discord
    

For the most current information on EURC, including the latest supported chains and features, visit https://developers.circle.com/stablecoins.

# 4. Stablecoin Contract Addresses

Official USDC and EURC smart contract addresses on supported blockchains.

## USDC Mainnet

|   |   |
|---|---|
|**Blockchain**|**Address**|
|Ethereum|`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`|
|Polygon PoS|`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`|
|Avalanche|`0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`|
|Arbitrum|`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`|
|Optimism|`0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`|
|Base|`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`|
|Solana|`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`|

## USDC Testnet

|   |   |
|---|---|
|**Blockchain**|**Address**|
|Ethereum Sepolia|`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`|
|Polygon Amoy|`0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`|
|Avalanche Fuji|`0x5425890298aed601595a70AB815c96711a31Bc65`|
|Arbitrum Sepolia|Check official docs|
|Base Sepolia|Check official docs|
|Solana Devnet|`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`|

## EURC Mainnet

|   |   |
|---|---|
|**Blockchain**|**Address**|
|Ethereum|`0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c`|
|Avalanche|`0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD`|

**Important**: Always verify addresses from official Circle documentation before use.

## Resources

- [USDC Overview](https://www.google.com/search?q=%23usdc-overview "null")
    
- [EURC Overview](https://www.google.com/search?q=%23eurc-overview "null")
    
- [Faucet](https://faucet.circle.com/ "null")
    

# 5. CCTP - Cross-Chain Transfer Protocol

Circle's Cross-Chain Transfer Protocol (CCTP) is a permissionless onchain utility that facilitates USDC transfers between blockchains via native burning and minting.

## Overview

With CCTP, USDC is effectively "teleported" from one blockchain to another through a burn-and-mint process. This eliminates the need for lock-and-mint bridges and their associated risks.

## Key Features

### Native Burn-and-Mint

- USDC is burned on the source chain
    
- Native USDC is minted on the destination chain
    
- No wrapped or synthetic tokens created
    
- Maintains 1:1 value across all chains
    

### Permissionless

- Open to all developers
    
- No Circle account required
    
- Integrate directly into apps
    
- No onboarding process needed
    

### Capital Efficient

- Unified liquidity across chains
    
- No fragmentation
    
- No liquidity pools required
    
- 1:1 transfers guaranteed
    

### Composable

- Build on top of CCTP
    
- Combine with DeFi protocols
    
- Create custom crosschain flows
    
- Extend functionality
    

## How CCTP Works

### Basic Flow

1. **Burn**: User initiates transfer, USDC is burned on source chain
    
2. **Attest**: Circle's attestation service signs the burn event
    
3. **Mint**: Signed attestation is used to mint USDC on destination chain
    
4. **Complete**: Recipient receives USDC on destination chain
    

## CCTP V2

CCTP V2 introduces enhanced functionality with two transfer methods:

### Fast Transfer

- **Speed**: Completes in seconds
    
- **Finality**: Uses soft finality (varies by chain)
    
- **Backing**: Secured by Circle's Fast Transfer Allowance
    
- **Use Case**: Low-latency applications
    
- **Fee**: Variable by chain, charged during minting
    

#### Fast Transfer Process

1. **Initiation**: User specifies amount and destination
    
2. **Burn Event**: USDC burned on source chain
    
3. **Instant Attestation**: Circle attests after soft finality
    
4. **Allowance Backing**: Fast Transfer Allowance temporarily debited
    
5. **Mint**: USDC minted on destination with fee collection
    
6. **Allowance Replenishment**: Allowance credited after hard finality
    

### Standard Transfer

- **Speed**: Depends on chain finality (typically minutes)
    
- **Finality**: Waits for hard finality
    
- **Security**: Maximum security guarantees
    
- **Use Case**: When speed is less critical
    
- **Fee**: Fixed minimum fee
    

#### Standard Transfer Process

1. **Initiation**: User specifies amount and destination
    
2. **Burn Event**: USDC burned on source chain
    
3. **Attestation**: Circle attests after hard finality
    
4. **Mint**: USDC minted on destination with fee
    
5. **Complete**: Recipient receives USDC
    

## Supported Chains

### Mainnet

- Ethereum
    
- Avalanche
    
- Arbitrum
    
- Optimism (OP Mainnet)
    
- Base
    
- Polygon PoS
    
- Noble (Cosmos)
    
- Solana
    

**Total**: 56 unique transfer routes between 8 networks

### Testnet

- Ethereum Sepolia
    
- Avalanche Fuji
    
- Arbitrum Sepolia
    
- OP Sepolia
    
- Base Sepolia
    
- Polygon PoS Amoy
    
- Noble Testnet
    
- Solana Devnet
    
- Sui Testnet
    

## Technical Architecture

### Onchain Components (EVM)

#### TokenMessengerV2

- Entrypoint for cross-chain USDC transfers
    
- Routes burn messages on source chain
    
- Routes mint messages on destination chain
    
- Manages transfer flow
    

#### MessageTransmitterV2

- Handles generic message passing
    
- Sends all messages on source chain
    
- Receives all messages on destination chain
    
- Manages nonce and replay protection
    

#### TokenMinterV2

- Responsible for minting and burning USDC
    
- Contains chain-specific settings
    
- Manages burn and mint permissions
    
- Enforces transfer limits
    

#### MessageV2

- Helper functions for cross-chain transfers
    
- Address conversion utilities (bytes32 ↔ address)
    
- Used for EVM ↔ non-EVM bridging
    

### Offchain Components

#### Attestation Service

- Observes burn events across all chains
    
- Signs attestations after finality
    
- Public API for attestation retrieval
    
- Manages Fast Transfer Allowance
    

**API Endpoint**: `https://iris-api.circle.com`

## Using CCTP

### Basic Integration Steps

1. **Burn USDC** on source chain
    
2. **Fetch Attestation** from Circle's API
    
3. **Mint USDC** on destination chain
    

### Code Example (EVM)

```
// 1. Approve TokenMessenger to spend USDC
IERC20(usdcAddress).approve(tokenMessengerAddress, amount);

// 2. Burn USDC and get transaction hash
bytes32 messageBytes = ITokenMessenger(tokenMessengerAddress)
    .depositForBurn(
        amount,
        destinationDomain,
        destinationAddressInBytes32,
        usdcAddress
    );

// 3. Fetch attestation (off-chain)
// GET [https://iris-api.circle.com/v2/messages/](https://iris-api.circle.com/v2/messages/){sourceDomain}/{messageHash}

// 4. Mint USDC on destination chain
IMessageTransmitter(messageTransmitterAddress)
    .receiveMessage(attestationPayload, signature);
```

### Fees

CCTP V2 fees are collected onchain during minting:

|   |   |
|---|---|
|**Transfer Type**|**Fee Structure**|
|Fast Transfer|Variable by chain|
|Standard Transfer|Fixed minimum fee|

**Important**: Always call the fees API before transactions as fees are subject to change.

**Fees API**: `/v2/burn/USDC/fees`

### Finality Thresholds

CCTP V2 uses finality thresholds (chain-agnostic confirmations):

- **Fast Transfer**: Threshold ≤ 1000
    
- **Standard Transfer**: Threshold > 1000
    
- Specified via `minFinalityThreshold` parameter
    

## Use Cases

### Crosschain Swaps

Enable users to swap assets across chains:

- User swaps ARB (Arbitrum) for OP (OP Mainnet)
    
- ARB → USDC on Arbitrum
    
- CCTP routes USDC to OP Mainnet
    
- USDC → OP on OP Mainnet
    
- User sees seamless single transaction
    

### Crosschain DeFi

Open positions across chains:

- User holds USDC on Ethereum
    
- Opens trading position on Avalanche DEX
    
- CCTP handles the bridge automatically
    
- User never switches wallets
    

### NFT Marketplaces

Buy/sell NFTs across chains:

- User with USDC on Avalanche
    
- Buys Arbitrum NFT on Uniswap
    
- Lists on OpenSea
    
- CCTP routes USDC in background
    
- User experiences one-click purchase
    

### Liquidity Management

Market makers and exchanges:

- Rebalance USDC across chains
    
- Meet demand efficiently
    
- Reduce operational costs
    
- Minimize latency
    

### Payment Rails

Enable crosschain payments:

- Send USDC from any chain
    
- Recipient receives on their preferred chain
    
- Automatic routing via CCTP
    
- No manual bridging required
    

## Advanced Features

### Composability

Extend CCTP with custom logic:

```
// Example: Burn USDC and deposit into DeFi protocol
function bridgeAndDeposit(
    uint256 amount,
    uint32 destinationDomain,
    address defiProtocol
) external {
    // Burn USDC via CCTP
    bytes32 messageBytes = tokenMessenger.depositForBurn(
        amount,
        destinationDomain,
        addressToBytes32(address(this)),
        usdcAddress
    );
    
    // On destination, auto-deposit to DeFi
    // (requires custom receiving contract)
}
```

### Batch Transfers

Send to multiple destinations in one transaction:

- Burn once on source chain
    
- Get single attestation
    
- Mint to multiple addresses
    
- Saves gas and time
    

## Smart Contract Addresses

### EVM Chains

See [CCTP EVM Contracts](https://www.google.com/search?q=./evm-contracts.md "null") for complete list of:

- TokenMessengerV2 addresses
    
- MessageTransmitterV2 addresses
    
- TokenMinterV2 addresses
    
- Domain IDs
    

### Non-EVM Chains

CCTP supports Solana and other non-EVM chains with chain-specific implementations. See official documentation for program IDs and interfaces.

## API Reference

### Attestation API

```
GET /v2/messages/{sourceDomain}/{messageHash}
```

Returns signed attestation for a burn event.

**Response**:

```
{
  "status": "complete",
  "attestation": "0x...",
  "messages": [{
    "message": "0x...",
    "signature": "0x..."
  }]
}
```

### Fees API

```
GET /v2/burn/USDC/fees
```

Returns current Fast and Standard Transfer fees.

### Transaction Status API

```
GET /v2/messages/{sourceDomain}/{messageHash}/status
```

Check if a message has been minted on destination.

## Migration from V1 to V2

CCTP V1 and V2 can coexist on the same blockchain. Key differences:

|   |   |   |
|---|---|---|
|**Feature**|**V1**|**V2**|
|Transfer Types|Standard only|Fast + Standard|
|Nonces|Onchain|Offchain assigned|
|Fees|No onchain fee|Onchain fees|
|Finality|Hard finality|Configurable|
|Attestation|After finality|Soft or hard|

**Recommendation**: Use V2 for new integrations.

## Security Considerations

### Best Practices

1. **Verify Attestations**: Always validate signatures
    
2. **Handle Errors**: Implement retry logic
    
3. **Monitor Transfers**: Track cross-chain state
    
4. **Test Thoroughly**: Use testnet extensively
    
5. **Set Appropriate maxFee**: Balance between speed and cost
    

### Known Risks

- **Finality Reversion**: Fast Transfers use soft finality
    
- **Fee Changes**: Fees can update with notice
    
- **Network Congestion**: May affect attestation time
    

## Resources

### Documentation

- [CCTP Technical Guide](https://www.google.com/search?q=./technical-guide.md "null")
    
- [EVM Smart Contracts](https://www.google.com/search?q=./evm-contracts.md "null")
    
- [CCTP FAQ](https://www.google.com/search?q=./faq.md "null")
    
- [API Reference](https://www.google.com/search?q=../api-reference/cctp.md "null")
    

### Tools

- **Attestation API**: https://iris-api.circle.com
    
- **Testnet Faucet**: https://faucet.circle.com
    
- **Sample Projects**: https://developers.circle.com/sample-projects
    

### Quickstarts

- [CCTP Quickstart](https://www.google.com/search?q=../quickstarts/cctp-quickstart.md "null")
    
- [CCTP with Wallets](https://www.google.com/search?q=../quickstarts/cctp-wallets.md "null")
    
- [Solana CCTP](https://www.google.com/search?q=./solana-cctp.md "null")
    

## Support

- **Documentation**: https://developers.circle.com/cctp
    
- **Discord**: Join Circle's developer community
    
- **GitHub**: https://github.com/circlefin/cctp-sample-app
    
- **Status**: https://status.circle.com
    

For the latest CCTP updates and supported chains, visit https://developers.circle.com/cctp.

# 6. Circle Gateway Overview

Circle Gateway allows anyone to deposit USDC to non-custodial smart contracts on any supported source chain to create a unified USDC balance that is instantly accessible across multiple blockchains.

## What is Gateway?

Gateway provides a unified USDC balance instantly accessible crosschain. Once deposits are finalized, users can transfer USDC to any supported destination chain with next-block access to their full balance.

## Key Features

### Instant Transfers

- Next-block access to funds on destination chain
    
- No waiting for source chain finality mid-transfer
    
- Front-load the finalization wait time
    

### Chain Abstraction

- Single unified balance across multiple chains
    
- Access full USDC balance from any supported chain
    
- No need to pre-allocate funds per chain
    

### Non-Custodial

- Users maintain full control of their USDC
    
- Circle cannot transfer or burn without explicit authorization
    
- Trustless withdrawal mechanism available
    

For complete documentation see /home/claude/circle-docs/gateway/

# 7. Quickstart: Transfer USDC

Quick guide to transferring USDC on EVM chains using viem framework.

## Prerequisites

- Node.js and npm installed
    
- MetaMask wallet
    
- Testnet native tokens (for gas)
    
- Testnet USDC from https://faucet.circle.com
    

## Setup

```
npm install viem
```

## Code Example

```
import { createWalletClient, createPublicClient, http, parseUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// USDC contract on Sepolia
const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

const USDC_ABI = [{
  name: 'transfer',
  type: 'function',
  inputs: [
    { name: '_to', type: 'address' },
    { name: '_value', type: 'uint256' }
  ],
  outputs: [{ name: '', type: 'bool' }],
  stateMutability: 'nonpayable'
}];

// Setup clients
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http()
});

// Send USDC
const hash = await walletClient.writeContract({
  address: USDC_ADDRESS,
  abi: USDC_ABI,
  functionName: 'transfer',
  args: [recipientAddress, parseUnits('10', 6)] // 10 USDC
});

console.log('Transaction:', hash);
```

## Resources

- [Full Tutorial](https://www.google.com/search?q=%23usdc-overview "null")
    
- [Contract Addresses](https://www.google.com/search?q=%23stablecoin-contract-addresses "null")
    
- [Faucet](https://faucet.circle.com/ "null")