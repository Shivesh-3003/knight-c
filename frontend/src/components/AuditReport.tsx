import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { TREASURY_ADDRESS, TreasuryABI } from '../lib/contracts';

export function AuditReport() {
  const [report, setReport] = useState<any[] | null>(null);
  const publicClient = usePublicClient();

  async function generateReport() {
    if (!publicClient) return;

    const currentBlock = await publicClient.getBlockNumber();
    const events = await publicClient.getContractEvents({
      address: TREASURY_ADDRESS,
      abi: TreasuryABI,
      eventName: 'PaymentExecuted',
      fromBlock: currentBlock - 1000n,
      toBlock: currentBlock
    });

    const txs = events.map(e => ({
      date: new Date(Number(e.args.timestamp) * 1000).toLocaleDateString(),
      recipient: e.args.recipient.slice(0, 8) + '...',
      amount: Number(formatUnits(e.args.amount as bigint, 6))
    }));

    setReport(txs);
  }

  return (
    <div>
      <button onClick={generateReport}>Generate Q4 Report</button>
      {report && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Recipient</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {report.map((tx, i) => (
              <tr key={i}>
                <td>{tx.date}</td>
                <td>{tx.recipient}</td>
                <td>${tx.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
