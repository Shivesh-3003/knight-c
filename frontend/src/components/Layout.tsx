import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { WalletConnect } from "@/components/WalletConnect";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";

export function Layout() {
  const { role, roleInfo, isConnected } = useUserRole();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">Knight-C Treasury</h1>
            {isConnected && (
              <Badge
                variant={role === 'cfo' ? 'default' : role === 'vp' ? 'secondary' : 'outline'}
                className="flex items-center gap-1 px-3 py-1 text-sm font-medium"
              >
                <span>{roleInfo.icon}</span>
                <span>{roleInfo.label}</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isConnected && role === 'unknown' && (
              <Badge variant="destructive" className="text-xs">
                Unauthorized Wallet
              </Badge>
            )}
            <WalletConnect />
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
