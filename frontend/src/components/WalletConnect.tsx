import { Button } from "@/components/ui/button";
import { Wallet, X, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// No external imports needed anymore!

declare global {
  interface Window {
    coinbaseWalletExtension?: any;
    ethereum?: any;
  }
}

const WALLET_OPTIONS = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    downloadUrl: "https://metamask.io/download/",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    icon: "🌈",
    downloadUrl: "https://rainbow.me/extension",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "💙",
    downloadUrl: "https://www.coinbase.com/wallet/downloads",
  },
];

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // UI State
  const [view, setView] = useState<"list" | "scan">("list");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    return () => {
        if (window.ethereum) window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) setAddress(null);
    else setAddress(accounts[0]);
  };

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) setAddress(accounts[0]);
      } catch (err) {
        console.error("Error", err);
      }
    }
  };

  const handleWalletClick = (walletId: string) => {
    setSelectedWalletId(walletId);
    setView("scan");
  };

  const disconnectWallet = () => {
    setAddress(null);
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleBack = () => {
    setView("list");
    setSelectedWalletId(null);
  };

  const selectedWallet = WALLET_OPTIONS.find(w => w.id === selectedWalletId);
  
  // Use a public API to generate the QR code image safely without libraries
  const qrCodeUrl = selectedWallet 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedWallet.downloadUrl)}`
    : "";

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsModalOpen(false)}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ height: view === 'scan' ? '520px' : 'auto' }}
      >
        
        {/* === HEADER === */}
        <div className="flex items-center justify-between p-5 pb-2">
          {view === "scan" ? (
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-blue-600 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
             <div className="w-10" /> 
          )}
          
          <h2 className="text-lg font-bold text-gray-900">
            {view === "scan" ? "Scan with your phone" : "Connect Wallet"}
          </h2>
          
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* === CONTENT === */}
        <div className="p-6 pt-2 flex-1 overflow-y-auto">
            
          {view === "list" ? (
            <div className="space-y-3 mt-2">
               {WALLET_OPTIONS.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletClick(wallet.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-all text-left group shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    {wallet.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-lg">
                      {wallet.name}
                    </span>
                    <span className="text-sm text-gray-500 group-hover:text-blue-600 font-medium">
                      QR Code or Extension
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // === SCAN VIEW ===
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              
              {/* QR Container */}
              <div className="relative mt-4 mb-6">
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[28px] opacity-20 blur-lg"></div>
                <div className="relative bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                  
                  {/* 1. Replaced Component with Standard Image */}
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan to connect" 
                    className="w-[240px] h-[240px] object-contain mix-blend-multiply opacity-90"
                  />

                  {/* Center Logo Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 bg-white rounded-xl shadow-lg flex items-center justify-center text-3xl border-[3px] border-white">
                      {selectedWallet?.icon}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Text */}
              {selectedWallet && (
                <div className="text-center space-y-4 w-full px-4">
                   <p className="text-gray-900 font-bold text-lg">
                     Scan with {selectedWallet.name}
                   </p>
                   
                   {/* Install Button */}
                   <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl w-full mt-2 border border-gray-100">
                      <span className="text-sm text-gray-500 font-medium">Don't have the app?</span>
                      <a 
                        href={selectedWallet.downloadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white border border-gray-200 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                      >
                        GET
                      </a>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <Button variant="default" size="sm" className="gap-2" disabled>
         <Wallet className="h-4 w-4" /> Connect Wallet
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={address ? "outline" : "default"}
        size="sm"
        className="gap-2 font-semibold"
        onClick={address ? disconnectWallet : () => setIsModalOpen(true)}
      >
        <Wallet className="h-4 w-4" />
        {address ? formatAddress(address) : "Connect Wallet"}
      </Button>

      {isModalOpen && createPortal(modalContent, document.body)}
    </>
  );
}