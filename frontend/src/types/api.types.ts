// Circle Gateway REST API TypeScript Types
// Cross-chain USDC transfers via Circle Gateway (NOT fiat on-ramp)

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
export type GatewayStatus = "pending" | "finalized" | "ready" | "pending_finality" | "not_found";
export type TransferStatus = "pending" | "complete" | "failed" | "success";
export type Chain = "Ethereum Sepolia" | "Arc Testnet";

// ===== 1. POST /api/circle/gateway/deposit =====
export interface GatewayDepositData {
  depositHash: string;
  amount: string;
  status: GatewayStatus;
  estimatedFinality: string;
  chain: Chain;
  nextStep: string;
}

export type GatewayDepositResponse = GatewayDepositData;

// ===== 2. GET /api/circle/gateway/attestation/:messageHash =====
export interface GatewayAttestationData {
  messageHash: string;
  attestation?: string;
  status: GatewayStatus;
  nextStep: string;
}

export type GatewayAttestationResponse = GatewayAttestationData;

// ===== 3. POST /api/circle/gateway/mint =====
export interface GatewayMintData {
  mintHash: string;
  amount: string;
  status: TransferStatus;
  chain: Chain;
  nextStep: string;
}

export type GatewayMintResponse = GatewayMintData;

// ===== 4. POST /api/circle/treasury/deposit =====
export interface TreasuryDepositData {
  depositHash: string;
  amount: string;
  treasuryAddress: string;
  chain: Chain;
  status: TransferStatus;
}

export type TreasuryDepositResponse = TreasuryDepositData;

// ===== 5. GET /api/circle/balance/sepolia/:address =====
// ===== 6. GET /api/circle/balance/arc/:address =====
export interface BalanceData {
  balance: string;
  currency: "USDC";
  chain: Chain;
  address: string;
}

export type BalanceResponse = BalanceData;

// ===== 7. GET /api/circle/treasury-balance =====
export interface TreasuryBalanceData {
  balance: string;
  contractAddress: string;
  network: string;
  currency: "USDC";
}

export type TreasuryBalanceResponse = TreasuryBalanceData;

// ===== 8. POST /api/circle/mock-mint =====
export interface MockMintData {
  transactionHash: string;
  amount: string;
  destinationChain: string;
  destination: string;
  type: "treasury_deposit" | "gateway_deposit" | "gateway_deposit_placeholder";
  estimatedFinality?: string;
  note?: string;
}

export type MockMintResponse = MockMintData;
