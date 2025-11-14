import { Clock, Play, Pause, Shield } from 'lucide-react';

interface FlowCardProps {
  flow: {
    id: string;
    flowType: string;
    frequency: string;
    description: string;
    nextExecution: string;
    isActive: boolean;
    useSalaryShield: boolean;
    totalAmount: number;
  };
}

export default function FlowCard({ flow }: FlowCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{flow.description}</h3>
            {flow.useSalaryShield && (
              <Shield className="w-4 h-4 text-blue-600" title="SalaryShield Enabled" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            {flow.flowType} • {flow.frequency}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          flow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {flow.isActive ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-600 mb-1">Next Execution</p>
          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {flow.nextExecution}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Amount per Run</p>
          <p className="text-sm font-medium text-gray-900">
            ${flow.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
          {flow.isActive ? (
            <>
              <Pause className="w-4 h-4" />
              Pause Flow
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Resume Flow
            </>
          )}
        </button>
        <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          View History
        </button>
      </div>
    </div>
  );
}
