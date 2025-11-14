import { useState } from 'react';
import { Plus, Play, Pause, Calendar } from 'lucide-react';
import { useFlows } from '../hooks/useFlows';
import FlowCard from '../components/FlowCard';
import CreateFlowModal from '../components/CreateFlowModal';

/**
 * Flows Page - Automated treasury operations
 *
 * Features:
 * - View all scheduled flows (payroll, vendors, allocations)
 * - Create recurring payment flows
 * - Configure SalaryShield for payroll privacy
 * - Pause/resume automated flows
 * - View execution history
 */
export default function Flows() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { flows, isLoading } = useFlows();

  const activeFlows = flows?.filter(f => f.isActive) || [];
  const pausedFlows = flows?.filter(f => !f.isActive) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automated Flows</h1>
          <p className="text-gray-600 mt-2">
            Recurring payments, payroll, and budget allocations executed automatically
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create New Flow
        </button>
      </div>

      {/* Flow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Active Flows" value={activeFlows.length} icon={<Play className="w-5 h-5" />} />
        <StatCard title="Paused Flows" value={pausedFlows.length} icon={<Pause className="w-5 h-5" />} />
        <StatCard title="Next Execution" value="2h 34m" icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Total Executed" value="1,247" icon={<Calendar className="w-5 h-5" />} />
      </div>

      {/* Active Flows */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Flows ({activeFlows.length})
        </h2>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">Loading flows...</div>
          ) : activeFlows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No active flows. Create one to automate treasury operations.
            </div>
          ) : (
            activeFlows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))
          )}
        </div>
      </div>

      {/* Paused Flows */}
      {pausedFlows.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Paused Flows ({pausedFlows.length})
          </h2>
          <div className="space-y-4">
            {pausedFlows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>
        </div>
      )}

      {/* Create Flow Modal */}
      {showCreateModal && (
        <CreateFlowModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </div>
  );
}
