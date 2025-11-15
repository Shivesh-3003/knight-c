import { useAccount } from "wagmi";

// Role addresses from environment variables
const ROLE_ADDRESSES = {
  cfo: import.meta.env.VITE_CFO_ADDRESS?.toLowerCase() || "",
  vp: import.meta.env.VITE_VP_ADDRESS?.toLowerCase() || "",
  employee: import.meta.env.VITE_EMPLOYEE_ADDRESS?.toLowerCase() || "",
};

export type UserRole = "cfo" | "vp" | "employee" | "unknown";

export interface RolePermissions {
  createPots: boolean;
  submitPayments: boolean;
  approvePayments: boolean;
  reallocateBudgets: boolean;
  depositFunds: boolean;
}

export interface RoleInfo {
  label: string;
  icon: string;
  permissions: RolePermissions;
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  cfo: {
    label: "CFO",
    icon: "🔑",
    permissions: {
      createPots: true,
      submitPayments: true,
      approvePayments: true,
      reallocateBudgets: true,
      depositFunds: true,
    },
  },
  vp: {
    label: "VP",
    icon: "👤",
    permissions: {
      createPots: false,
      submitPayments: true,
      approvePayments: false,
      reallocateBudgets: false,
      depositFunds: false,
    },
  },
  employee: {
    label: "Employee",
    icon: "👥",
    permissions: {
      createPots: false,
      submitPayments: false,
      approvePayments: false,
      reallocateBudgets: false,
      depositFunds: false,
    },
  },
  unknown: {
    label: "Unknown",
    icon: "❓",
    permissions: {
      createPots: false,
      submitPayments: false,
      approvePayments: false,
      reallocateBudgets: false,
      depositFunds: false,
    },
  },
};

export function useUserRole() {
  const { address, isConnected } = useAccount();

  const detectRole = (): UserRole => {
    if (!address || !isConnected) {
      return "unknown";
    }

    const normalizedAddress = address.toLowerCase();

    if (normalizedAddress === ROLE_ADDRESSES.cfo) {
      return "cfo";
    }
    if (normalizedAddress === ROLE_ADDRESSES.vp) {
      return "vp";
    }
    if (normalizedAddress === ROLE_ADDRESSES.employee) {
      return "employee";
    }

    return "unknown";
  };

  const role = detectRole();
  const roleInfo = ROLE_INFO[role];

  return {
    role,
    roleInfo,
    address,
    isConnected,
  };
}
