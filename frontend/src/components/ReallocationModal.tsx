import { useState, useEffect } from 'react';
import { stringToBytes32 } from '../lib/utils';
import { parseUnits, formatUnits } from 'viem';
import { usePublicClient } from 'wagmi';
import { TREASURY_ADDRESS, TreasuryABI } from '../lib/contracts';

interface ReallocationModalProps {
  targetPot: string;
  shortfall: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReallocationModal({ targetPot, shortfall, onClose, onSuccess }: ReallocationModalProps) {
  const [sourcePot, setSourcePot] = useState('');
  const [pots, setPots] = useState<{ id: string; available: number }[]>([]);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function loadBalances() {
      if (!publicClient) return;

      const potIds = ['engineering', 'marketing', 'operations'];
      const results = [];

      for (const id of potIds) {
        if (id === targetPot) continue;

        const [budget, spent, threshold] = await publicClient.readContract({
          address: TREASURY_ADDRESS,
          abi: TreasuryABI,
          functionName: 'getPotDetails', // FIXED: Use explicit getter
          args: [stringToBytes32(id)]
        }) as any[];

        const available = Number(formatUnits(budget - spent, 6));
        results.push({ id, available });
      }
      setPots(results);
    }
    loadBalances();
  }, [publicClient, targetPot]);

  async function handleReallocate() {
    // await contract.write.reallocate([
    //   stringToBytes32(sourcePot),
    //   stringToBytes32(targetPot),
    //   parseUnits(shortfall.toString(), 6)
    // ]);
    onSuccess();
  }

  return (
    <div>
      <h3>Reallocate Budget</h3>
      <select onChange={(e) => setSourcePot(e.target.value)}>
        <option value="">Select source</option>
        {pots.map(p => (
          <option key={p.id} value={p.id}>
            {p.id.toUpperCase()} (${p.available.toLocaleString()})
          </option>
        ))}
      </select>
      <button onClick={handleReallocate}>Approve</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
