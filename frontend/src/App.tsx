import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { config } from "@/lib/wagmi";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Approvals from "./pages/Approvals";
import ScheduledFlows from "./pages/ScheduledFlows";
import Compliance from "./pages/Compliance";
import NotFound from "./pages/NotFound";
import WalletGateway from "./pages/WalletGateway.tsx";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="scheduled" element={<ScheduledFlows />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="walletgateway" element={<WalletGateway />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
