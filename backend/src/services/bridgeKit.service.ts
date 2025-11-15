import { BridgeKit } from '@circle-fin/bridge-kit';
import { createViemAdapter } from '@circle-fin/adapter-viem-v2';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum, avalanche, base, mainnet, optimism, polygon } from 'viem/chains';

export class BridgeKitService {
  private bridgeKit: BridgeKit;

  constructor() {
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    
    const sourceClient = createWalletClient({
      account,
      chain: arbitrum, // Source chain (Arc not in viem yet, use custom)
      transport: http(process.env.ARC_TESTNET_RPC_URL),
    });

    const destinationClient = createPublicClient({
      chain: mainnet, // Destination chain
      transport: http(process.env.MAINNET_RPC_URL),
    });

    this.bridgeKit = new BridgeKit({
      source: createViemAdapter(sourceClient),
      destination: createViemAdapter(destinationClient),
    });
  }

  /**
   * Transfer USDC cross-chain in just a few lines!
   */
  async transferCrossChain(
    amount: string,
    destinationAddress: string,
    destinationChain: 'ethereum' | 'arbitrum' | 'avalanche' | 'base' | 'optimism' | 'polygon'
  ) {
    try {
      const result = await this.bridgeKit.transfer({
        amount,
        destinationAddress,
      });

      return {
        transactionHash: result.sourceTransactionHash,
        messageHash: result.messageHash,
        attestation: result.attestation,
      };
    } catch (error) {
      throw new Error(`Cross-chain transfer failed: ${error}`);
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(messageHash: string) {
    try {
      const status = await this.bridgeKit.getTransferStatus(messageHash);
      return status;
    } catch (error) {
      throw new Error(`Get status failed: ${error}`);
    }
  }
}