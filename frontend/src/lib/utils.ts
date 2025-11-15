import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, parseUnits, stringToHex, pad } from "viem";
import {
  USDC_DECIMALS,
  ARC_EXPLORER_URL,
  ADDRESS_SHORT_LENGTH,
  TX_HASH_SHORT_LENGTH,
} from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ===== Web3 Utilities =====

/**
 * Convert a string to bytes32 format for contract calls
 * @param str - String to convert (e.g., "engineering")
 * @returns bytes32 hex string (e.g., "0x656e67696e656572696e6700000000000000000000000000000000000000000")
 */
export function stringToBytes32(str: string): `0x${string}` {
  const hex = stringToHex(str, { size: 32 });
  return hex;
}

/**
 * Parse USDC amount from human-readable string to contract format
 * Arc Best Practice: USDC uses 6 decimals (ERC20 interface)
 * @param amount - Amount in USDC (e.g., "1000.50")
 * @returns BigInt in 6 decimal format (e.g., 1000500000n)
 */
export function parseUSDC(amount: string | number): bigint {
  return parseUnits(amount.toString(), USDC_DECIMALS);
}

/**
 * Format USDC amount from contract format to human-readable string
 * Arc Best Practice: USDC uses 6 decimals (ERC20 interface)
 * @param amount - Amount in wei (6 decimals)
 * @param includeSymbol - Whether to include $ symbol
 * @returns Formatted string (e.g., "$1,000.50" or "1000.50")
 */
export function formatUSDC(amount: bigint, includeSymbol: boolean = true): string {
  const formatted = formatUnits(amount, USDC_DECIMALS);
  const number = parseFloat(formatted);

  const formattedValue = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);

  return includeSymbol ? `$${formattedValue}` : formattedValue;
}

// ===== Address and Hash Utilities =====

/**
 * Truncate an Ethereum address for display
 * @param address - Full address (e.g., "0x1234567890abcdef...")
 * @returns Shortened address (e.g., "0x1234...cdef")
 */
export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, ADDRESS_SHORT_LENGTH.START)}...${address.slice(-ADDRESS_SHORT_LENGTH.END)}`;
}

/**
 * Truncate a transaction hash for display
 * @param hash - Full transaction hash
 * @returns Shortened hash (e.g., "0x12345678...abcdef90")
 */
export function truncateTxHash(hash: string): string {
  if (!hash) return "";
  return `${hash.slice(0, TX_HASH_SHORT_LENGTH.START)}...${hash.slice(-TX_HASH_SHORT_LENGTH.END)}`;
}

/**
 * Get Arc Explorer URL for a transaction
 * @param txHash - Transaction hash
 * @returns Full explorer URL
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${ARC_EXPLORER_URL}/tx/${txHash}`;
}

/**
 * Get Arc Explorer URL for an address
 * @param address - Wallet or contract address
 * @returns Full explorer URL
 */
export function getExplorerAddressUrl(address: string): string {
  return `${ARC_EXPLORER_URL}/address/${address}`;
}

// ===== Number Formatting =====

/**
 * Format a number with commas
 * @param num - Number to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a percentage
 * @param value - Decimal value (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage (e.g., "75.00%")
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ===== Validation Utilities =====

/**
 * Check if a string is a valid Ethereum address
 * @param address - Address to validate
 * @returns true if valid
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if a string is a valid amount (positive number)
 * @param amount - Amount string to validate
 * @returns true if valid
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

// ===== Date Utilities =====

/**
 * Format an ISO timestamp to a readable date string
 * @param isoString - ISO 8601 timestamp
 * @returns Formatted date (e.g., "Jan 15, 2025 10:30 AM")
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Get relative time (e.g., "2 minutes ago")
 * @param isoString - ISO 8601 timestamp
 * @returns Relative time string
 */
export function getRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
