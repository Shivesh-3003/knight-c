import { useEffect, useState } from 'react';
import { usePublicClient, useContractRead } from 'wagmi';
import { TREASURY_ADDRESS, TreasuryABI } from '../lib/contracts';

export function ApprovalQueue() {
  const [activePayments, setActivePayments] = useState<any[]>([]);
  const publicClient = usePublicClient();

  const { data: queueHashes } = useContractRead({
    address: TREASURY_ADDRESS,
    abi: TreasuryABI,
    functionName: 'pendingQueue'
  });

  useEffect(() => {
    async function filterQueue() {
      if (!queueHashes || !publicClient) return;

      const active = [];
      for (const txHash of queueHashes as `0x${string}`[]) {
        const [potId, recipientCount, approvalCount, executed] =
          await publicClient.readContract({
            address: TREASURY_ADDRESS,
            abi: TreasuryABI,
            functionName: 'getPendingDetails', // FIXED: Use explicit getter
            args: [txHash]
          }) as any[];

        if (!executed) {
          active.push({ txHash, potId, recipientCount, approvalCount });
        }
      }
      setActivePayments(active);
    }
    filterQueue();
  }, [queueHashes, publicClient]);

  return (
    <div>
      <h2>Pending Approvals</h2>
      {activePayments.map(p => (
        <div key={p.txHash}>
          <p>Recipients: {p.recipientCount}</p>
          <p>Approvals: {p.approvalCount}</p>
          <button onClick={() => {
            // contract.write.approvePayment([p.txHash])
          }}>
            Approve
          </button>
        </div>
      ))}
    </div>
  );
}
