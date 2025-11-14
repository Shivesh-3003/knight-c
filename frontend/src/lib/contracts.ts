/**
 * Smart contract addresses and ABIs for Knight-C
 * Deploy contracts to Arc testnet and update these addresses
 */

// Contract Addresses (TODO: Update after deployment)
export const TREASURY_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const USDC_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const CIRCLE_GATEWAY_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// Treasury Contract ABI (simplified for placeholder)
export const TREASURY_ABI = [
  {
    name: 'getTotalBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'fundTreasury',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'createPot',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'budget', type: 'uint256' },
      { name: 'isPrivate', type: 'bool' },
      { name: 'approvalThreshold', type: 'uint256' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'getAllPots',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32[]' }],
  },
] as const;

// Pot Contract ABI (simplified)
export const POT_ABI = [
  {
    name: 'getRemainingBudget',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'executePayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'purpose', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'executePayrollWithJitter',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'jitterDelays', type: 'uint256[]' },
    ],
    outputs: [],
  },
] as const;

// Flow Contract ABI (simplified)
export const FLOW_ABI = [
  {
    name: 'createFlow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'flowType', type: 'uint8' },
      { name: 'frequency', type: 'uint8' },
      { name: 'source', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'useSalaryShield', type: 'bool' },
      { name: 'description', type: 'string' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'getActiveFlows',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32[]' }],
  },
] as const;

// USDC Token ABI (ERC20 standard)
export const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;
