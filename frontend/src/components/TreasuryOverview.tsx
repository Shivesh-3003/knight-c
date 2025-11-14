import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for demo
const mockData = [
  { date: 'Jan', balance: 8500000 },
  { date: 'Feb', balance: 9200000 },
  { date: 'Mar', balance: 8800000 },
  { date: 'Apr', balance: 9500000 },
  { date: 'May', balance: 10000000 },
  { date: 'Jun', balance: 9800000 },
];

export default function TreasuryOverview() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Treasury Balance Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
