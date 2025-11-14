/**
 * Custom hook for payment history and tracking
 */
export function usePayments() {
  // Mock data for placeholder
  const mockPayments = [
    {
      id: '1',
      recipient: 'BrasilAds Agency',
      amount: 80000,
      pot: 'Marketing',
      isPrivate: false,
      status: 'completed',
      timestamp: '2 hours ago',
      txHash: '0xabc123...',
    },
    {
      id: '2',
      recipient: 'Engineering Payroll',
      amount: 120000,
      pot: 'Engineering',
      isPrivate: true,
      status: 'completed',
      timestamp: '1 day ago',
      txHash: '0xdef456...',
    },
    {
      id: '3',
      recipient: 'Vendor Payment',
      amount: 50000,
      pot: 'Operations',
      isPrivate: false,
      status: 'pending',
      timestamp: '10 minutes ago',
    },
  ];

  return {
    payments: mockPayments,
    isLoading: false,
    error: null,
  };
}
