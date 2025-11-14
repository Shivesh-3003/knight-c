import { useState } from 'react';
import { FileText, Download, Calendar, Shield } from 'lucide-react';
import { useAuditReports } from '../hooks/useAudit';

/**
 * Audit Page - Instant compliance reporting
 *
 * Features:
 * - Generate audit reports in 5 seconds
 * - Cryptographically verifiable transaction history
 * - Export to PDF/CSV for external auditors
 * - Filter by date range, amount, department
 * - View key authorization for private Pot data
 */
export default function Audit() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [minAmount, setMinAmount] = useState('');
  const { reports, generateReport, isGenerating } = useAuditReports();

  const handleGenerateReport = () => {
    generateReport({
      startDate: dateRange.start,
      endDate: dateRange.end,
      minAmount: minAmount ? parseFloat(minAmount) : 0,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit & Compliance</h1>
        <p className="text-gray-600 mt-2">
          Immutable audit trail with cryptographic verification
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Transactions"
          value="1,247"
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          title="Private Transactions"
          value="384"
          icon={<Shield className="w-5 h-5" />}
        />
        <StatCard
          title="Total Volume"
          value="$12.4M"
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          title="Reports Generated"
          value={reports?.length || 0}
          icon={<FileText className="w-5 h-5" />}
        />
      </div>

      {/* Generate Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Audit Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="flex items-center text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Amount (USDC)
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="e.g., 50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Include Options */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-sm text-gray-700">Include transaction details</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-sm text-gray-700">Include approver signatures</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-sm text-gray-700">Include budget impact</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-gray-700">
              Include private Pot data (requires view key authorization)
            </span>
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate Audit Report
            </>
          )}
        </button>

        {isGenerating && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              Querying on-chain data and generating cryptographically verifiable report...
            </p>
          </div>
        )}
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reports</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports?.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.generatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.period}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.transactionCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${report.totalValue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
              {(!reports || reports.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No reports generated yet. Create your first audit report above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blockchain Verification Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Cryptographic Verification</h3>
        <p className="text-sm text-blue-800">
          Every transaction in your audit report includes a blockchain transaction hash that can be
          independently verified on the Arc block explorer. Approver signatures are cryptographically
          valid and the timeline is immutable - entries cannot be backdated or altered.
        </p>
      </div>
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
