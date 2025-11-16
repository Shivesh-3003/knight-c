/**
 * Funding Page
 *
 * Multi-chain Circle Gateway treasury funding interface
 */

import { MultiChainGatewayFunding } from '@/components/MultiChainGatewayFunding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, Zap, Globe } from 'lucide-react';

export function Funding() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fund Treasury</h1>
        <p className="text-muted-foreground mt-2">
          Transfer USDC from multiple chains to your Arc treasury via Circle Gateway
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Multi-Chain Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Fund from Ethereum, Base, Arbitrum, Polygon, and Avalanche testnets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Instant Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              After first deposit, all transfers are instant (&lt;500ms)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Unified Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              One balance accessible from all supported chains
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Alert>
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription className="space-y-2 text-sm">
          <p>
            <strong>Step 1:</strong> Deposit USDC from any chain to create a unified balance (one-time, ~15 min per chain)
          </p>
          <p>
            <strong>Step 2:</strong> Instantly transfer from unified balance to Arc treasury (repeatable, &lt;500ms)
          </p>
          <p className="text-muted-foreground italic">
            💡 You can close the page during finality wait. We'll save your progress!
          </p>
        </AlertDescription>
      </Alert>

      {/* Main Funding Interface */}
      <MultiChainGatewayFunding />

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Testnet Tokens?</CardTitle>
          <CardDescription>Get USDC and native gas tokens for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>USDC (all chains):</strong>{' '}
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Circle Testnet Faucet
            </a>
          </div>
          <div>
            <strong>Base Sepolia ETH:</strong>{' '}
            <a
              href="https://www.alchemy.com/faucets/base-sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Alchemy Faucet
            </a>
          </div>
          <div>
            <strong>Polygon Amoy POL:</strong>{' '}
            <a
              href="https://faucet.polygon.technology"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Polygon Faucet
            </a>
          </div>
          <div>
            <strong>Avalanche Fuji AVAX:</strong>{' '}
            <a
              href="https://core.app/tools/testnet-faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              Core Faucet
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
