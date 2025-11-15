import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  CircleBalanceResponse,
  DepositRequest,
  DepositResponse,
  WithdrawRequest,
  WithdrawResponse,
  CrossChainTransferRequest,
  TransferResponse,
  TransferStatusResponse,
  TreasuryBalanceResponse,
  TransferStatus,
} from "@/types/api.types";
import { POLLING_INTERVAL, MAX_POLLING_ATTEMPTS } from "./constants";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error("[API Response Error]", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Type guard for API errors
export function isApiError(error: unknown): error is AxiosError<{ error: string }> {
  return axios.isAxiosError(error) && error.response !== undefined;
}

/**
 * Get Circle wallet balance
 */
export async function getCircleBalance(): Promise<ApiResponse<CircleBalanceResponse>> {
  try {
    const response = await api.get<CircleBalanceResponse>("/api/circle/balance");
    return { success: true, data: response.data };
  } catch (error) {
    if (isApiError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Deposit fiat → USDC
 * @param amount - Amount in fiat currency
 * @param currency - Currency code (e.g., "USD")
 * @param destinationType - "wallet" (Circle wallet) or "contract" (TreasuryVault)
 */
export async function depositFiat(
  amount: number,
  currency: string = "USD",
  destinationType: "wallet" | "contract" = "contract"
): Promise<ApiResponse<DepositResponse>> {
  try {
    const request: DepositRequest = { amount, currency, destinationType };
    const response = await api.post<DepositResponse>("/api/circle/deposit", request);
    return { success: true, data: response.data };
  } catch (error) {
    if (isApiError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Withdraw USDC → fiat
 * @param amount - Amount in USDC
 * @param bankAccountId - Bank account ID from Circle
 * @param source - "wallet" (Circle wallet) or "contract" (TreasuryVault)
 */
export async function withdrawToFiat(
  amount: number,
  bankAccountId: string,
  source: "wallet" | "contract" = "contract"
): Promise<ApiResponse<WithdrawResponse>> {
  try {
    const request: WithdrawRequest = { amount, bankAccountId, source };
    const response = await api.post<WithdrawResponse>("/api/circle/withdraw", request);
    return { success: true, data: response.data };
  } catch (error) {
    if (isApiError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Transfer USDC from Circle wallet to Arc contract
 * @param amount - Amount in USDC
 */
export async function transferToArc(
  amount: number
): Promise<ApiResponse<TransferResponse>> {
  try {
    const response = await api.post<TransferResponse>("/api/circle/transfer-to-arc", {
      amount,
    });
    return { success: true, data: response.data };
  } catch (error) {
    if (isApiError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Get transfer status by ID
 * @param transferId - Circle transfer ID
 */
export async function getTransferStatus(
  transferId: string
): Promise<ApiResponse<TransferStatusResponse>> {
  try {
    const response = await api.get<TransferStatusResponse>(
      `/api/circle/transfer-status/${transferId}`
    );
    return { success: true, data: response.data };
  } catch (error) {
    if (isApiError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Poll transfer status until complete or timeout
 * @param transferId - Circle transfer ID
 * @param onProgress - Optional callback for status updates
 */
export async function pollTransferStatus(
  transferId: string,
  onProgress?: (status: TransferStatus) => void
): Promise<ApiResponse<TransferStatusResponse>> {
  let attempts = 0;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    const result = await getTransferStatus(transferId);

    if (!result.success) {
      return result;
    }

    const status = result.data.status;
    onProgress?.(status);

    // Terminal states
    if (status === "complete" || status === "failed") {
      return result;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    attempts++;
  }

  return {
    success: false,
    error: "Transfer status polling timeout",
  };
}

/**
 * Cross-chain transfer via CCTP
 * @param amount - Amount in USDC
 * @param destinationChain - Target chain (e.g., "ethereum", "polygon")
 * @param destinationAddress - Recipient address on destination chain
 */
export async function crossChainTransfer(
  amount: number,
  destinationChain: string,
  destinationAddress: string
): Promise<ApiResponse<TransferResponse>> {
  try {
    const request: CrossChainTransferRequest = {
      amount,
      destinationChain,
      destinationAddress,
    };
    const response = await api.post<TransferResponse>(
      "/api/circle/cross-chain",
      request
    );
    return { success: true, data: response.data };
  } catch (error) {
    if (isApiError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}

/**
 * Get treasury contract balance (on-chain)
 */
export async function getTreasuryBalance(): Promise<
  ApiResponse<TreasuryBalanceResponse>
> {
  try {
    const response = await api.get<TreasuryBalanceResponse>(
      "/api/circle/treasury-balance"
    );
    return { success: true, data: response.data };
  } catch (error) {
    if (isApiError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
    return { success: false, error: "Unknown error occurred" };
  }
}
