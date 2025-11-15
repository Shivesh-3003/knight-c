import { Button } from "@/components/ui/button";
import { Wallet, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { arcTestnet, isCorrectNetwork } from "@/lib/wagmi";

const WALLET_ICONS: Record<string, string> = {
  metaMask: "🦊",
  walletConnect: "🔗",
  coinbaseWallet: "💙",
  injected: "🔌",
};

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      console.log("[WalletConnect] Connectors status:",
        connectors.map(c => ({
          name: c.name,
          id: c.id,
          type: c.type
        }))
      );
    }
  }, [mounted, connectors]);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleConnect = (connector: any) => {
    try {
      connect({ connector, chainId: arcTestnet.id });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const getWalletIcon = (connectorName: string): string => {
    const lowerName = connectorName.toLowerCase();
    if (lowerName.includes("metamask")) return WALLET_ICONS.metaMask;
    if (lowerName.includes("walletconnect")) return WALLET_ICONS.walletConnect;
    if (lowerName.includes("coinbase")) return WALLET_ICONS.coinbaseWallet;
    return WALLET_ICONS.injected;
  };

  const isOnCorrectNetwork = isCorrectNetwork(chain?.id);

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* === HEADER === */}
        <div className="flex items-center justify-between p-5 pb-2">
          <div className="w-10" />

          <h2 className="text-lg font-bold text-gray-900">
            Connect Wallet
          </h2>

          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* === CONTENT === */}
        <div className="p-6 pt-2">
          <div className="space-y-3 mt-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={isPending}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-all text-left group shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  {getWalletIcon(connector.name)}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-lg">
                    {connector.name}
                  </span>
                  <span className="text-sm text-gray-500 group-hover:text-blue-600 font-medium">
                    {isPending ? "Connecting..." : "Click to connect"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Arc Testnet Notice */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700 font-medium text-center">
              🌐 Connecting to Arc Testnet (Chain ID: {arcTestnet.id})
            </p>
          </div>
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
      {isConnected ? (
        <div className="flex items-center gap-2">
          {/* Network Indicator */}
          {!isOnCorrectNetwork && (
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">
              Wrong Network
            </span>
          )}

          {/* Connected Address Button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-semibold"
            onClick={handleDisconnect}
          >
            <Wallet className="h-4 w-4" />
            {address && formatAddress(address)}
          </Button>
        </div>
      ) : (
        <Button
          variant="default"
          size="sm"
          className="gap-2 font-semibold"
          onClick={() => setIsModalOpen(true)}
          disabled={isPending}
        >
          <Wallet className="h-4 w-4" />
          {isPending ? "Connecting..." : "Connect Wallet"}
        </Button>
      )}

      {isModalOpen && createPortal(modalContent, document.body)}
    </>
  );
}