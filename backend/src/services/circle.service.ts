// backend/src/services/circle.service.ts
import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk';

export class CircleService {
  private client: Circle;
  private walletId: string;

  constructor() {
    this.client = new Circle(
      process.env.CIRCLE_API_KEY!,
      CircleEnvironments.sandbox, // Use 'production' for live
    );

    // Use wallet ID from environment
    this.walletId = process.env.CIRCLE_WALLET_ID || '';
  }

  /**
   * Deposit USD and convert to USDC on Arc (Circle Mint)
   *
   * Flow for Circle Mint:
   * 1. You wire USD to Circle (done outside this API)
   * 2. Circle credits your Circle wallet with equivalent USDC
   * 3. This method transfers that USDC to your TreasuryVault contract on Arc
   *
   * @param amount - Amount in USD/USDC
   * @param destinationAddress - TreasuryVault contract address on Arc
   * @returns Transfer details including transfer ID
   */
  async depositToContract(amount: string, destinationAddress: string) {
    try {
      if (!this.walletId) {
        throw new Error('CIRCLE_WALLET_ID not configured. Set it in .env file.');
      }

      // Transfer USDC from Circle wallet to Arc blockchain contract
      const response = await this.client.transfers.createTransfer({
        source: {
          type: 'wallet',
          id: this.walletId,
        },
        destination: {
          type: 'blockchain',
          address: destinationAddress,
          chain: 'ARC',
        },
        amount: {
          amount,
          currency: 'USD', // Circle converts USD to USDC
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Deposit to contract failed: ${error}`);
    }
  }

  /**
   * Withdraw USDC from contract and redeem for USD (Off-ramp)
   *
   * Flow:
   * 1. Transfer USDC from Arc contract to Circle wallet (requires separate contract call)
   * 2. Redeem USDC in Circle wallet for USD via wire transfer
   *
   * @param amount - Amount in USDC to redeem
   * @param bankAccountId - Circle bank account ID for wire transfer
   * @param contractAddress - TreasuryVault contract address (for withdrawal)
   * @returns Redemption transfer details
   */
  async withdrawFromContract(amount: string, bankAccountId: string, contractAddress: string) {
    try {
      if (!this.walletId) {
        throw new Error('CIRCLE_WALLET_ID not configured');
      }

      // Note: This assumes USDC is already in Circle wallet
      // In practice, you'd need to first withdraw from contract to wallet
      // (requires a separate blockchain transaction)

      const response = await this.client.transfers.createTransfer({
        source: {
          type: 'wallet',
          id: this.walletId,
        },
        destination: {
          type: 'wire',
          beneficiaryBankAccountId: bankAccountId,
        },
        amount: {
          amount,
          currency: 'USD',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Withdrawal failed: ${error}`);
    }
  }

  /**
   * Get Circle wallet balance
   * Shows how much USDC is available in your Circle wallet for deposits
   */
  async getCircleWalletBalance() {
    try {
      if (!this.walletId) {
        throw new Error('CIRCLE_WALLET_ID not configured');
      }

      const response = await this.client.wallets.getWallet({ id: this.walletId });
      return response.data;
    } catch (error) {
      throw new Error(`Get wallet balance failed: ${error}`);
    }
  }

  /**
   * Get transfer status
   * @param transferId - Transfer ID from Circle API
   */
  async getTransferStatus(transferId: string) {
    try {
      const response = await this.client.transfers.getTransfer({ id: transferId });
      return response.data;
    } catch (error) {
      throw new Error(`Get transfer status failed: ${error}`);
    }
  }
}