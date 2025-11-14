import { useState } from 'react';
import { Send, Filter, Download, Shield } from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import PaymentList from '../components/PaymentList';
import ExecutePaymentModal from '../components/ExecutePaymentModal';

/**
 * Payments Page - Execute and track payments
 *
 * Features:
 * - Execute one-time payments from Pots
 * - Batch payroll with SalaryShield mode
 * - Real-time payment tracking
 * - Multi-signature approval workflow
 * - Payment history and export
 */
export default function Payments() {
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const { payments, isLoading } = usePayments();

  const filteredPayments = payments?.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  }) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-2">
            Execute payments with sub-second finality and optional privacy
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExecuteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
            Execute Payment
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Shield className="w-5 h-5" />
            Payroll (SalaryShield)
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Payments"
          value={payments?.length || 0}
          subtitle="All time"
        />
        <StatCard
          title="Pending Approval"
          value={payments?.filter(p => p.status === 'pending').length || 0}
          subtitle="Awaiting multi-sig"
        />
        <StatCard
          title="This Month"
          value="$2.4M"
          subtitle="147 payments"
        />
        <StatCard
          title="Avg Settlement"
          value="0.4s"
          subtitle="Arc finality"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">Filter:</span>
        </div>
        <div className="flex gap-2">
          <FilterButton
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
          >
            All
          </FilterButton>
          <FilterButton
            active={filterStatus === 'pending'}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </FilterButton>
          <FilterButton
            active={filterStatus === 'completed'}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </FilterButton>
        </div>
        <button className="ml-auto flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Payment List */}
      <PaymentList payments={filteredPayments} isLoading={isLoading} />

      {/* Execute Payment Modal */}
      {showExecuteModal && (
        <ExecutePaymentModal
          isOpen={showExecuteModal}
          onClose={() => setShowExecuteModal(false)}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
}

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
