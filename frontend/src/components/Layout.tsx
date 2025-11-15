import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { WalletConnect } from "@/components/WalletConnect";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

export function Layout() {
  const { role, roleInfo, isConnected } = useUserRole();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">Knight-C Treasury</h1>
            {isConnected && (
              <Badge
                variant={
                  role === "cfo"
                    ? "default"
                    : role === "vp"
                    ? "secondary"
                    : role === "employee"
                    ? "outline"
                    : "destructive"
                }
              >
                <span className="mr-1">{roleInfo.icon}</span>
                <span>{roleInfo.label}</span>
              </Badge>
            )}
          </div>
          <WalletConnect />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
