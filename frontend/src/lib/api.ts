import axios, { AxiosError } from "axios";
import type {
  ApiResponse,
  GatewayDepositResponse,
  GatewayAttestationResponse,
  GatewayMintResponse,
  TreasuryDepositResponse,
  BalanceResponse,
  TreasuryBalanceResponse,
  MockMintResponse,
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
 * Deposit USDC to Gateway Wallet on Sepolia
 * Initiates cross-chain transfer flow
 * @param amount - Amount in USDC
 */
export async function depositToGateway(amount: string): Promise<ApiResponse<GatewayDepositResponse>> {
  try {
    const response = await api.post<ApiResponse<GatewayDepositResponse>>(
      "/api/circle/gateway/deposit",
      { amount }
    );
    return response.data;
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
 * Get Gateway attestation for cross-chain transfer
 * @param messageHash - Transaction hash from depositToGateway
 */
export async function getGatewayAttestation(
  messageHash: string
): Promise<ApiResponse<GatewayAttestationResponse>> {
  try {
    const response = await api.get<ApiResponse<GatewayAttestationResponse>>(
      `/api/circle/gateway/attestation/${messageHash}`
    );
    return response.data;
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
 * Mint USDC on Arc using Gateway attestation
 * @param attestation - Cryptographic proof from Gateway
 * @param amount - Amount to mint
 */
export async function mintOnArc(
  attestation: string,
  amount: string
): Promise<ApiResponse<GatewayMintResponse>> {
  try {
    const response = await api.post<ApiResponse<GatewayMintResponse>>(
      "/api/circle/gateway/mint",
      { attestation, amount }
    );
    return response.data;
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
 * Deposit USDC to TreasuryVault on Arc
 * @param amount - Amount in USDC
 */
export async function depositToTreasury(
  amount: string
): Promise<ApiResponse<TreasuryDepositResponse>> {
  try {
    const response = await api.post<ApiResponse<TreasuryDepositResponse>>(
      "/api/circle/treasury/deposit",
      { amount }
    );
    return response.data;
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
 * Get USDC balance on Ethereum Sepolia
 * @param address - Wallet address
 */
export async function getSepoliaBalance(address: string): Promise<ApiResponse<BalanceResponse>> {
  try {
    const response = await api.get<ApiResponse<BalanceResponse>>(
      `/api/circle/balance/sepolia/${address}`
    );
    return response.data;
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
 * Get USDC balance on Arc Testnet
 * @param address - Wallet address
 */
export async function getArcBalance(address: string): Promise<ApiResponse<BalanceResponse>> {
  try {
    const response = await api.get<ApiResponse<BalanceResponse>>(
      `/api/circle/balance/arc/${address}`
    );
    return response.data;
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
 * Get USDC balance on Base Sepolia
 * @param address - Wallet address
 */
export async function getBaseBalance(address: string): Promise<ApiResponse<BalanceResponse>> {
  try {
    const response = await api.get<ApiResponse<BalanceResponse>>(
      `/api/circle/balance/base/${address}`
    );
    return response.data;
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
 * Get USDC balance on Arbitrum Sepolia
 * @param address - Wallet address
 */
export async function getArbitrumBalance(address: string): Promise<ApiResponse<BalanceResponse>> {
  try {
    const response = await api.get<ApiResponse<BalanceResponse>>(
      `/api/circle/balance/arbitrum/${address}`
    );
    return response.data;
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
 * Get USDC balance on Polygon Amoy
 * @param address - Wallet address
 */
export async function getPolygonBalance(address: string): Promise<ApiResponse<BalanceResponse>> {
  try {
    const response = await api.get<ApiResponse<BalanceResponse>>(
      `/api/circle/balance/polygon/${address}`
    );
    return response.data;
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
export async function getTreasuryBalance(): Promise<ApiResponse<TreasuryBalanceResponse>> {
  try {
    const response = await api.get<ApiResponse<TreasuryBalanceResponse>>(
      "/api/circle/treasury-balance"
    );
    return response.data;
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
 * Poll Gateway attestation until ready
 * @param messageHash - Transaction hash from depositToGateway
 * @param onProgress - Optional callback for status updates
 */
export async function pollGatewayAttestation(
  messageHash: string,
  onProgress?: (status: string) => void
): Promise<ApiResponse<GatewayAttestationResponse>> {
  let attempts = 0;

  while (attempts < MAX_POLLING_ATTEMPTS) {
    const result = await getGatewayAttestation(messageHash);

    if (!result.success) {
      return result;
    }

    const status = result.data.status;
    onProgress?.(status);

    // Terminal states
    if (status === "ready" || status === "not_found") {
      return result;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    attempts++;
  }

  return {
    success: false,
    error: "Gateway attestation polling timeout",
  };
}

/**
 * Mock Circle Mint flow: Simulate USD → USDC conversion and deposit to treasury
 * @param amount - Amount in USD
 * @param destinationChain - Chain to deposit to (arc, ethereum, base, arbitrum, polygon)
 */
export async function mockMintAndDeposit(
  amount: string,
  destinationChain: string
): Promise<ApiResponse<MockMintResponse>> {
  try {
    const response = await api.post<ApiResponse<MockMintResponse>>(
      "/api/circle/mock-mint",
      { amount, destinationChain }
    );
    return response.data;
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
 * Get Circle Gateway unified USDC balance across all chains
 * @param address - Wallet address
 */
export async function getGatewayBalance(address: string): Promise<ApiResponse<BalanceResponse>> {
  try {
    const response = await api.get<ApiResponse<BalanceResponse>>(
      `/api/circle/balance/gateway/${address}`
    );
    return response.data;
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
 * Transfer from Gateway unified balance to Arc treasury (instant)
 * @param amount - Amount in USDC
 * @param recipientAddress - Recipient wallet address
 */
export async function transferToTreasury(
  amount: string,
  recipientAddress: string
): Promise<ApiResponse<any>> {
  try {
    const response = await api.post<ApiResponse<any>>(
      "/api/circle/transfer-to-treasury",
      { amount, recipientAddress }
    );
    return response.data;
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
