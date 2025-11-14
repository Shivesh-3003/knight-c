import { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { usePots } from '../hooks/usePots';
import PotCard from '../components/PotCard';
import CreatePotModal from '../components/CreatePotModal';

/**
 * Pots Page - Manage departmental budgets
 *
 * Features:
 * - View all departmental Pots
 * - Create new Pots with privacy settings
 * - Configure spending rules and approvals
 * - Manage beneficiary whitelists
 * - Real-time budget tracking
 */
export default function Pots() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrivate, setShowPrivate] = useState(true);
  const { pots, isLoading } = usePots();

  const publicPots = pots?.filter(p => !p.isPrivate) || [];
  const privatePots = pots?.filter(p => p.isPrivate) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departmental Pots</h1>
          <p className="text-gray-600 mt-2">
            Smart contract sub-accounts with configurable privacy and enforced budgets
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create New Pot
        </button>
      </div>

      {/* Privacy Toggle */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Show Private Pots:</span>
        <button
          onClick={() => setShowPrivate(!showPrivate)}
          className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-gray-50"
        >
          {showPrivate ? (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-sm">Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="text-sm">Hidden</span>
            </>
          )}
        </button>
      </div>

      {/* Public Pots */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Public Pots ({publicPots.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {publicPots.map((pot) => (
            <PotCard key={pot.id} pot={pot} />
          ))}
        </div>
      </div>

      {/* Private Pots */}
      {showPrivate && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Private Pots ({privatePots.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {privatePots.map((pot) => (
              <PotCard key={pot.id} pot={pot} />
            ))}
          </div>
        </div>
      )}

      {/* Create Pot Modal */}
      {showCreateModal && (
        <CreatePotModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
