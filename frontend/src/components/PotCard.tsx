import { Lock, TrendingUp, AlertCircle } from 'lucide-react';

interface PotCardProps {
  pot: {
    id: string;
    name: string;
    isPrivate: boolean;
    allocatedBudget: number;
    spentAmount: number;
    utilization: number;
  };
}

export default function PotCard({ pot }: PotCardProps) {
  const remaining = pot.allocatedBudget - pot.spentAmount;
  const isOverBudget = pot.utilization > 100;
  const isNearLimit = pot.utilization > 80 && pot.utilization <= 100;

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{pot.name}</h3>
          {pot.isPrivate && (
            <div className="flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-600">Private (Arc Shielded)</span>
            </div>
          )}
        </div>
        {isOverBudget && <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>

      {/* Budget Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Allocated:</span>
          <span className="font-medium text-gray-900">
            ${pot.allocatedBudget.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Spent:</span>
          <span className="font-medium text-gray-900">
            ${pot.spentAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Remaining:</span>
          <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            ${remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Budget Utilization</span>
          <span className={`text-xs font-medium ${
            isOverBudget ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-900'
          }`}>
            {pot.utilization}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(pot.utilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
          View Details
        </button>
        <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Allocate Funds
        </button>
      </div>
    </div>
  );
}
