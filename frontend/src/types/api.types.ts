// Circle Gateway REST API TypeScript Types

// ===== Response Envelopes =====
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ===== Status Types =====
export type TransferStatus = "pending" | "complete" | "failed";
export type DestinationType = "wallet" | "contract";
export type SourceType = "wallet" | "contract";
export type Currency = "USD" | "USDC";
export type DestinationChain = "ethereum" | "polygon" | "arbitrum" | "avalanche";

// ===== 1. GET /api/circle/balance =====
export interface CircleBalanceData {
  usdc: string;
  usd: string;
  walletAddress: string;
}

export type CircleBalanceResponse = ApiResponse<CircleBalanceData>;

// ===== 2. POST /api/circle/deposit =====
export interface DepositRequest {
  amount: string;
  currency: Currency;
  destinationType: DestinationType;
}

export interface DepositData {
  transferId: string;
  status: TransferStatus;
  estimatedCompletion: string;
}

export type DepositResponse = ApiResponse<DepositData>;

// ===== 3. POST /api/circle/withdraw =====
export interface WithdrawRequest {
  amount: string;
  bankAccountId: string;
  source: SourceType;
}

export interface WithdrawData {
  transferId: string;
  status: TransferStatus;
}

export type WithdrawResponse = ApiResponse<WithdrawData>;

// ===== 4. POST /api/circle/transfer-to-arc =====
export interface TransferToArcRequest {
  amount: string;
}

export interface TransferToArcData {
  challengeId?: string;
  txHash?: string;
  status: TransferStatus;
}

export type TransferToArcResponse = ApiResponse<TransferToArcData>;

// ===== 5. GET /api/circle/status/:transferId =====
export interface TransferStatusData {
  id: string;
  status: TransferStatus;
  amount: string;
  txHash?: string;
  completedAt?: string;
}

export type TransferStatusResponse = ApiResponse<TransferStatusData>;

// ===== 6. POST /api/circle/cross-chain =====
export interface CrossChainTransferRequest {
  amount: string;
  destinationChain: DestinationChain;
  destinationAddress: string;
}

export interface CrossChainTransferData {
  messageHash: string;
  attestation?: string;
  status: TransferStatus;
}

export type CrossChainTransferResponse = ApiResponse<CrossChainTransferData>;

// ===== 7. GET /api/circle/treasury-balance =====
export interface TreasuryBalanceData {
  contractAddress: string;
  balance: string;
  network: string;
}

export type TreasuryBalanceResponse = ApiResponse<TreasuryBalanceData>;
