import { ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletConnect } from '@/components/WalletConnect';
import { Wallet, AlertCircle } from 'lucide-react';

interface RequireWalletProps {
  children: ReactNode;
  requireRole?: 'cfo' | 'vp' | 'employee'; // Optional: require specific role
  message?: string;
}

/**
 * Guard component that requires wallet connection before rendering children
 *
 * @param children - Content to render when wallet is connected
 * @param requireRole - Optional: specific role required (shows different message if wrong role)
 * @param message - Optional: custom message to show when wallet not connected
 *
 * @example
 * <RequireWallet>
 *   <Dashboard />
 * </RequireWallet>
 *
 * @example
 * <RequireWallet requireRole="cfo" message="Only the CFO can access this page">
 *   <AdminPanel />
 * </RequireWallet>
 */
export function RequireWallet({ children, requireRole, message }: RequireWalletProps) {
  const { isConnected, isConnecting } = useAccount();

  // Still connecting - show loading state
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 animate-pulse" />
              Connecting...
            </CardTitle>
            <CardDescription>
              Checking wallet connection
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Not connected - show connection required message
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border-2 border-blue-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Wallet Connection Required</CardTitle>
            <CardDescription className="text-base mt-2">
              {message || 'Please connect your wallet to access the Knight-C Treasury platform'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <WalletConnect />

            {requireRole && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg w-full">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This page requires {requireRole.toUpperCase()} access. Make sure
                    you're connecting with the authorized wallet.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm text-muted-foreground w-full">
              <p className="font-semibold text-gray-900">Supported Wallets:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>MetaMask</li>
                <li>WalletConnect (Mobile wallets)</li>
                <li>Coinbase Wallet</li>
                <li>Other injected wallets</li>
              </ul>
            </div>

            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg w-full">
              <p className="text-xs text-gray-600">
                <strong>Arc Testnet Configuration:</strong><br />
                Chain ID: 5042002 (0x4cef52)<br />
                RPC: https://rpc.testnet.arc.network<br />
                Currency: USDC
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Wallet connected - render children
  return <>{children}</>;
}
