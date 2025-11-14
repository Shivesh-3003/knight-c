import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { WalletConnect } from "@/components/WalletConnect";

export function Layout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
          <h1 className="text-lg font-semibold text-foreground">Knight-C Treasury</h1>
          <WalletConnect />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
