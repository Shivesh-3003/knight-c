import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Recipient {
  walletAddress: string;
  amount: number;
}

export interface Flow {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  recipients: Recipient[];
  totalAmount: number;
  status: 'active' | 'scheduled' | 'inactive';
}

export interface NewFlowData {
  name: string;
  frequency: string;
  nextRun: string;
  recipients: Recipient[];
}

interface FlowState {
  flows: Flow[];
  addFlow: (newFlowData: NewFlowData) => void;
  updateFlow: (flowId: string, updatedFlowData: NewFlowData) => void;
  deleteFlow: (flowId: string) => void;
}

const INITIAL_MOCK_FLOWS: Flow[] = [];

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      flows: INITIAL_MOCK_FLOWS,
      addFlow: (newFlowData) => {
        const { flows } = get();
        const totalAmount = newFlowData.recipients.reduce((sum, r) => sum + r.amount, 0);
        const newFlow: Flow = {
          ...newFlowData,
          id: (flows.length + 1).toString(),
          totalAmount,
          status: 'scheduled',
        };
        set({ flows: [...flows, newFlow] });
      },
      updateFlow: (flowId, updatedFlowData) => {
        const { flows } = get();
        const totalAmount = updatedFlowData.recipients.reduce((sum, r) => sum + r.amount, 0);
        const updatedFlows = flows.map((flow) =>
          flow.id === flowId
            ? { ...flow, ...updatedFlowData, totalAmount }
            : flow
        );
        set({ flows: updatedFlows });
      },
      deleteFlow: (flowId) => {
        const { flows } = get();
        const updatedFlows = flows.filter((flow) => flow.id !== flowId);
        set({ flows: updatedFlows });
      },
    }),
    {
      name: 'flow-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as FlowState;
        if (persisted.flows && persisted.flows.length > 0) {
          return { ...currentState, flows: persisted.flows };
        }
        return currentState;
      },
    }
  )
);
