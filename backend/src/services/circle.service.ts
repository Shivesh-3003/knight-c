// backend/src/services/circle.service.ts
import { Circle, CircleEnvironments } from '@circle-fin/circle-sdk';

export class CircleService {
  private client: Circle;

  constructor() {
    this.client = new Circle(
      process.env.CIRCLE_API_KEY!,
      CircleEnvironments.sandbox, // Use 'production' for live
    );
  }

  /**
   * Mint USDC from USD (On-ramp)
   * Uses Circle Mint API
   */
  async mintUSDC(amount: string, walletId: string) {
    try {
      const response = await this.client.transfers.createTransfer({
        source: {
          type: 'wallet',
          id: walletId,
        },
        destination: {
          type: 'blockchain',
          chain: 'ARC',
        },
        amount: {
          amount,
          currency: 'USD',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Mint failed: ${error}`);
    }
  }

  /**
   * Redeem USDC for USD (Off-ramp)
   */
  async redeemUSDC(amount: string, walletId: string, bankAccountId: string) {
    try {
      const response = await this.client.transfers.createTransfer({
        source: {
          type: 'blockchain',
          chain: 'ARC',
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
      throw new Error(`Redeem failed: ${error}`);
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(walletId: string) {
    try {
      const response = await this.client.wallets.getWallet({ id: walletId });
      return response.data;
    } catch (error) {
      throw new Error(`Get balance failed: ${error}`);
    }
  }

  /**
   * Create developer-controlled wallet (for treasury)
   */
  async createTreasuryWallet() {
    try {
      const response = await this.client.wallets.createWallet({
        accountType: 'SCA', // Smart Contract Account
        blockchains: ['ARC'],
        metadata: [{ key: 'name', value: 'Treasury Wallet' }],
      });

      return response.data;
    } catch (error) {
      throw new Error(`Create wallet failed: ${error}`);
    }
  }
}