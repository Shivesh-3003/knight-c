import { useAccount } from 'wagmi';
import { useMemo } from 'react';

/**
 * User roles in the Knight-C treasury system
 */
export type UserRole = 'cfo' | 'vp' | 'employee' | 'unknown';

/**
 * Role configuration from environment variables
 */
const ROLE_ADDRESSES = {
  cfo: (import.meta.env.VITE_CFO_ADDRESS as string)?.toLowerCase(),
  vp: (import.meta.env.VITE_VP_ADDRESS as string)?.toLowerCase(),
  employee: (import.meta.env.VITE_EMPLOYEE_ADDRESS as string)?.toLowerCase(),
};

/**
 * Role permissions and display information
 */
export const ROLE_INFO = {
  cfo: {
    label: 'CFO',
    icon: '🔑',
    description: 'Chief Financial Officer - Full Treasury Access',
    permissions: {
      createPots: true,
      submitPayments: true,
      approvePayments: true,
      reallocateBudgets: true,
      viewAll: true,
      depositFunds: true,
    },
  },
  vp: {
    label: 'VP',
    icon: '👤',
    description: 'Vice President - Department Manager',
    permissions: {
      createPots: false,
      submitPayments: true,
      approvePayments: false,
      reallocateBudgets: false,
      viewAll: true,
      depositFunds: false,
    },
  },
  employee: {
    label: 'Employee',
    icon: '👥',
    description: 'Employee - View Only',
    permissions: {
      createPots: false,
      submitPayments: false,
      approvePayments: false,
      reallocateBudgets: false,
      viewAll: false, // Can only view own payments
      depositFunds: false,
    },
  },
  unknown: {
    label: 'Unknown',
    icon: '❓',
    description: 'Unauthorized Wallet',
    permissions: {
      createPots: false,
      submitPayments: false,
      approvePayments: false,
      reallocateBudgets: false,
      viewAll: false,
      depositFunds: false,
    },
  },
} as const;

/**
 * Hook to detect user role based on connected wallet address
 *
 * @returns {Object} User role information
 * @returns {UserRole} role - The detected role ('cfo' | 'vp' | 'employee' | 'unknown')
 * @returns {boolean} isLoading - Whether wallet connection is still loading
 * @returns {string | undefined} address - Connected wallet address
 * @returns {typeof ROLE_INFO[UserRole]} roleInfo - Full role information and permissions
 *
 * @example
 * const { role, roleInfo, address, isLoading } = useUserRole();
 *
 * if (roleInfo.permissions.createPots) {
 *   // Show "Create Pot" button
 * }
 */
export function useUserRole() {
  const { address, isConnected, isConnecting } = useAccount();

  const role: UserRole = useMemo(() => {
    if (!address || !isConnected) return 'unknown';

    const normalizedAddress = address.toLowerCase();

    // Check CFO first (highest priority)
    if (normalizedAddress === ROLE_ADDRESSES.cfo) {
      return 'cfo';
    }

    // Check VP
    if (normalizedAddress === ROLE_ADDRESSES.vp) {
      return 'vp';
    }

    // Check Employee
    if (normalizedAddress === ROLE_ADDRESSES.employee) {
      return 'employee';
    }

    // Unknown wallet
    return 'unknown';
  }, [address, isConnected]);

  const roleInfo = ROLE_INFO[role];

  return {
    role,
    roleInfo,
    address,
    isConnected,
    isLoading: isConnecting,
  };
}

/**
 * Type guard to check if user has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof typeof ROLE_INFO.cfo.permissions): boolean {
  return ROLE_INFO[role].permissions[permission];
}
