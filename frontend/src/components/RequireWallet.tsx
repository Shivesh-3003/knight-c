import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnect } from "@/components/WalletConnect";
import { Loader2, Wallet } from "lucide-react";

interface RequireWalletProps {
  children: ReactNode;
}

export function RequireWallet({ children }: RequireWalletProps) {
  const { isConnected, isConnecting } = useAccount();

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <CardTitle>Connecting Wallet</CardTitle>
            <CardDescription>Please wait while we connect to your wallet...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show wallet connection screen if not connected
  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access Knight-C Treasury Management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WalletConnect />
            <div className="mt-6 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-700">Supported Wallets:</p>
              <ul className="ml-4 list-disc space-y-1 text-gray-600">
                <li>MetaMask</li>
                <li>WalletConnect</li>
                <li>Coinbase Wallet</li>
              </ul>
              <p className="mt-3 font-semibold text-gray-700">Network:</p>
              <p className="text-gray-600">Arc Testnet (Chain ID: 5042002)</p>
              <p className="mt-2 text-xs text-gray-500">
                Make sure your wallet is connected to Arc Testnet before proceeding.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wallet is connected, render children
  return <>{children}</>;
}
