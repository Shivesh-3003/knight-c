import { ExternalLink, Lock } from 'lucide-react';

interface RecentPaymentsProps {
  limit?: number;
}

export default function RecentPayments({ limit = 10 }: RecentPaymentsProps) {
  // Mock data
  const payments = [
    { id: '1', recipient: 'BrasilAds Agency', amount: 80000, pot: 'Marketing', isPrivate: false, timestamp: '2 hours ago' },
    { id: '2', recipient: 'Engineering Payroll', amount: 120000, pot: 'Engineering', isPrivate: true, timestamp: '1 day ago' },
    { id: '3', recipient: 'AWS Services', amount: 15000, pot: 'Operations', isPrivate: false, timestamp: '2 days ago' },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.slice(0, limit).map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {payment.isPrivate && <Lock className="w-4 h-4 text-blue-600" />}
                    <span className="text-sm text-gray-900">{payment.recipient}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${payment.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {payment.pot}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {payment.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                    Completed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
