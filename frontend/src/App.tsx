import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

import { config } from './lib/wagmi';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pots from './pages/Pots';
import Flows from './pages/Flows';
import Payments from './pages/Payments';
import Audit from './pages/Audit';

import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pots" element={<Pots />} />
                <Route path="/flows" element={<Flows />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/audit" element={<Audit />} />
              </Routes>
            </Layout>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
