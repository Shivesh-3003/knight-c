import { Shield, TrendingUp, Clock, Lock } from 'lucide-react';
import { useTreasuryBalance } from '../hooks/useTreasury';
import { usePots } from '../hooks/usePots';
import TreasuryOverview from '../components/TreasuryOverview';
import PotCard from '../components/PotCard';
import RecentPayments from '../components/RecentPayments';

/**
 * Dashboard - Main treasury overview page
 *
 * Features:
 * - Real-time global treasury balance
 * - Departmental Pot status cards
 * - Recent payment activity
 * - Budget utilization metrics
 * - Quick actions for CFO
 */
export default function Dashboard() {
  const { balance, isLoading: balanceLoading } = useTreasuryBalance();
  const { pots, isLoading: potsLoading } = usePots();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Treasury Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Real-time visibility across all funds, updated every 0.4 seconds
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Treasury"
          value={balanceLoading ? "Loading..." : `$${balance?.formatted || '0'}`}
          icon={<TrendingUp className="w-6 h-6" />}
          change="+2.4%"
          changeType="positive"
        />
        <MetricCard
          title="Active Pots"
          value={potsLoading ? "..." : pots?.length || 0}
          icon={<Shield className="w-6 h-6" />}
          subtitle="Departments"
        />
        <MetricCard
          title="Scheduled Flows"
          value="12"
          icon={<Clock className="w-6 h-6" />}
          subtitle="Automated"
        />
        <MetricCard
          title="Private Pots"
          value="2"
          icon={<Lock className="w-6 h-6" />}
          subtitle="Arc Privacy"
        />
      </div>

      {/* Treasury Overview Chart */}
      <TreasuryOverview />

      {/* Departmental Pots */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Departmental Pots</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create New Pot
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {potsLoading ? (
            <div className="col-span-3 text-center py-12">Loading pots...</div>
          ) : (
            pots?.map((pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <RecentPayments limit={10} />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative';
  subtitle?: string;
}

function MetricCard({ title, value, icon, change, changeType, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </p>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
