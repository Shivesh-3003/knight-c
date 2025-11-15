import React, { useState, useEffect } from 'react';

// --- Icons (Inline SVGs) ---
const CircleLogo = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const NetworkIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12H16M16 12L13 9M16 12L13 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LinkIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefreshCw = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Check = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Loader = ({ className = "h-4 w-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// --- UI Components ---
const Card = ({ className, children }) => (
  <div className={`border border-gray-200 bg-white shadow-sm rounded-xl ${className}`}>{children}</div>
);
const CardContent = ({ className, children }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);
const Badge = ({ className, children }) => (
  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-gray-200 text-gray-900 ${className}`}>{children}</div>
);
const Button = ({ className, variant = "default", size = "default", children, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
  const variantStyles = {
    default: "bg-gray-900 text-white hover:bg-gray-800",
    outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-900",
    ghost: "hover:bg-gray-50 text-gray-600 hover:text-gray-900",
    primary_light: "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
  };
  const sizeStyles = { default: "h-10 px-4 py-2", sm: "h-8 rounded-md px-3 text-xs" };
  return <button className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>{children}</button>;
};

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(amount) + " USDC";
const truncateAddress = (addr) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "";

export default function CircleGatewayDashboard() {
  const [arcWallet, setArcWallet] = useState(null);
  const [gatewayWallets, setGatewayWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // -------------------------------------------------------------------------
      // BACKEND INTEGRATION: Fetch Gateway State
      // -------------------------------------------------------------------------
      // Call your backend endpoint: GET /api/gateway/unified-balance
      // This endpoint should:
      // 1. Check the user's ARC wallet balance.
      // 2. Check connected Source Chains (Sepolia, Fuji) for USDC balances.
      // 3. Check if the Source Chain wallet has `approved` the Circle Gateway Contract.
      // -------------------------------------------------------------------------
      
      // Mock Data mimicking the backend response:
      await new Promise(r => setTimeout(r, 1000));
      setArcWallet({
        id: "arc-main",
        name: "Arc Testnet",
        address: "0x71C...9A21",
        balance: 2500.00,
      });

      setGatewayWallets([
        {
          id: "eth-sepolia",
          name: "Ethereum Sepolia",
          address: "0x9f8...1a0b",
          balance: 1000.00,
          isAuthorized: true, 
          isConverting: false
        },
        {
          id: "avax-fuji",
          name: "Avalanche Fuji",
          address: "0x3d2...9c1d",
          balance: 500.00,
          isAuthorized: false, 
          isConverting: false
        }
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAuthorize = async (id) => {
    // -------------------------------------------------------------------------
    // BACKEND INTEGRATION: Authorize Gateway
    // -------------------------------------------------------------------------
    // Call your backend endpoint: POST /api/gateway/authorize
    // Payload: { chainId: id, walletAddress: ... }
    //
    // 1. The backend should generate an `approve()` transaction or typed data (EIP-2612 permit).
    // 2. Frontend prompts user to sign this (e.g., via MetaMask or embedded wallet).
    // 3. Backend broadcasts the transaction (possibly using a Paymaster for gasless XP).
    // -------------------------------------------------------------------------
    
    console.log(`Authorizing Gateway for ${id}...`);
    
    // Optimistic UI Update
    setGatewayWallets(prev => prev.map(w => w.id === id ? { ...w, isConverting: true } : w));
    setTimeout(() => {
      setGatewayWallets(prev => prev.map(w => w.id === id ? { ...w, isAuthorized: true, isConverting: false } : w));
    }, 2000);
  };

  const handleMoveToArc = async (id) => {
    // -------------------------------------------------------------------------
    // BACKEND INTEGRATION: Execute Transfer (Burn & Mint)
    // -------------------------------------------------------------------------
    // Call your backend endpoint: POST /api/gateway/transfer
    // Payload: { sourceChainId: id, amount: wallet.balance }
    //
    // 1. Backend generates a `depositForBurn` transaction on the Source Chain.
    // 2. User signs.
    // 3. Circle Gateway detects the burn and issues an attestation.
    // 4. Backend (or Circle Relayer) submits the mint transaction on Arc.
    // -------------------------------------------------------------------------

    console.log(`Moving funds from ${id} to Arc...`);

    // Optimistic UI Update
    setGatewayWallets(prev => prev.map(w => w.id === id ? { ...w, isConverting: true } : w));
    setTimeout(() => {
      setGatewayWallets(prev => {
        const wallet = prev.find(w => w.id === id);
        // Move funds locally to show instant effect
        setArcWallet(curr => ({ ...curr, balance: curr.balance + wallet.balance }));
        return prev.map(w => w.id === id ? { ...w, balance: 0, isConverting: false } : w);
      });
    }, 2000);
  };

  const totalLiquidity = (arcWallet?.balance || 0) + gatewayWallets.reduce((acc, w) => acc + w.balance, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 text-gray-900" />
          <p className="text-gray-500 font-medium">Syncing Gateway State...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans p-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Circle Gateway</h1>
          <p className="mt-2 text-gray-500">Unified liquidity across Arc and supported chains.</p>
        </div>
        <div className="text-right">
           <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Purchasing Power</span>
           <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalLiquidity)}</div>
        </div>
      </div>

      {/* Arc Main Wallet */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CircleLogo className="h-5 w-5 text-blue-600" /> Destination Chain (Arc)
        </h2>
        <Card className="border-blue-100 bg-blue-50/30 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Available on Arc Testnet</p>
                <div className="text-4xl font-bold text-gray-900 mt-1">{formatCurrency(arcWallet.balance)}</div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Mainnet Ready</Badge>
                  <span className="text-sm text-gray-400 font-mono bg-white border border-gray-100 px-2 py-1 rounded">{truncateAddress(arcWallet.address)}</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full"><CircleLogo className="h-6 w-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Gateway Chains */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <NetworkIcon className="h-5 w-5 text-gray-500" /> Gateway Sources
        </h2>
        <div className="grid gap-4">
          {gatewayWallets.map((wallet) => (
            <Card key={wallet.id} className="transition-all hover:border-gray-300">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100"><LinkIcon className="h-6 w-6 text-gray-400" /></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{wallet.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-mono">{truncateAddress(wallet.address)}</span>
                      {wallet.isAuthorized && <span className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full"><Check className="h-3 w-3 mr-1" /> Linked</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                   <div className="text-right">
                      <div className="font-bold text-gray-900 text-lg">{formatCurrency(wallet.balance)}</div>
                      <div className="text-xs text-gray-400">Source Liquidity</div>
                   </div>
                   {wallet.balance > 0 ? (
                      wallet.isConverting ? (
                        <Button disabled className="w-32 bg-gray-100 text-gray-400"><Loader className="mr-2 h-4 w-4" /> Processing</Button>
                      ) : wallet.isAuthorized ? (
                        <Button variant="primary_light" className="w-32" onClick={() => handleMoveToArc(wallet.id)}><RefreshCw className="mr-2 h-4 w-4" /> Move to Arc</Button>
                      ) : (
                        <Button variant="outline" className="w-32 border-dashed border-gray-300" onClick={() => handleAuthorize(wallet.id)}>Enable Gateway</Button>
                      )
                   ) : (
                     <Button disabled variant="ghost" className="w-32 text-gray-300">Empty</Button>
                   )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}