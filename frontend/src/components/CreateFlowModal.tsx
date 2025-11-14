import { X } from 'lucide-react';

interface CreateFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateFlowModal({ isOpen, onClose }: CreateFlowModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create Automated Flow</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Flow Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="payroll">Payroll (with SalaryShield)</option>
              <option value="vendor">Vendor Payments</option>
              <option value="allocation">Budget Allocation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Pot</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="engineering">Engineering</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operations</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Flow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
