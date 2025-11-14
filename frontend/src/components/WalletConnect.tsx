import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function WalletConnect() {
  // Placeholder for wallet connection
  const isConnected = false;

  return (
    <Button
      variant={isConnected ? "outline" : "default"}
      size="sm"
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isConnected ? "0x1234...5678" : "Connect Wallet"}
    </Button>
  );
}
