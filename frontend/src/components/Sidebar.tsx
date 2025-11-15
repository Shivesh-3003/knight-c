import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, CheckCircle2, Calendar, Shield, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Approvals", href: "/approvals", icon: CheckCircle2 },
  { name: "Scheduled Flows", href: "/scheduled", icon: Calendar },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "WalletGateway", href: "/WalletGateway", icon: Landmark },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Landmark className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Knight-C</h1>
            <p className="text-xs text-sidebar-foreground/60">Treasury Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/"}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="text-xs font-medium text-sidebar-foreground">Built on Arc</p>
          <p className="mt-1 text-xs text-sidebar-foreground/60">
            Mathematical certainty for corporate treasury
          </p>
        </div>
      </div>
    </aside>
  );
}
