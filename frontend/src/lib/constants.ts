// Arc Network Configuration
export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_EXPLORER_URL = "https://testnet.arcscan.app";
export const USDC_DECIMALS = 6; // Critical: ERC20 interface uses 6 decimals

// Pot Configuration
export const POT_IDS = ["engineering", "marketing", "operations"] as const;
export type PotId = typeof POT_IDS[number];

export const POT_NAMES: Record<PotId, string> = {
  engineering: "Engineering",
  marketing: "Marketing",
  operations: "Operations",
};

export const POT_COLORS: Record<PotId, string> = {
  engineering: "#3b82f6", // blue-500
  marketing: "#10b981", // green-500
  operations: "#f59e0b", // amber-500
};

export const POT_ICONS: Record<PotId, string> = {
  engineering: "⚙️",
  marketing: "📢",
  operations: "🏢",
};

// Approval Thresholds
export const DEFAULT_APPROVAL_THRESHOLD = 50000; // $50K in USDC (with 6 decimals = 50000000000)

// Polling Configuration
export const POLLING_INTERVAL = 2000; // 2 seconds
export const MAX_POLLING_ATTEMPTS = 60; // 2 minutes total (60 * 2s = 120s)

// Display Configuration
export const ADDRESS_SHORT_LENGTH = {
  START: 6, // "0x1234"
  END: 4,   // "cdef"
};

export const TX_HASH_SHORT_LENGTH = {
  START: 10, // "0x12345678"
  END: 8,    // "abcdef90"
};
