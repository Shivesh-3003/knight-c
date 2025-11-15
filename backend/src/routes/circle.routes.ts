import { Router } from 'express';
import { CircleService } from '../services/circle.service';
import { TreasuryService } from '../services/treasury.service';

const router = Router();
const circleService = new CircleService();
const treasuryService = new TreasuryService();

// ===== CIRCLE GATEWAY ENDPOINTS =====
// These endpoints handle cross-chain USDC transfers via Circle Gateway
// NOT fiat on-ramp - handles USDC movement between Ethereum Sepolia and Arc Testnet

/**
 * POST /api/circle/gateway/deposit
 * Deposit USDC to Gateway Wallet on Sepolia
 * Initiates cross-chain transfer flow
 */
router.post('/gateway/deposit', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Amount is required',
      });
    }

    const result = await circleService.depositToGateway(amount);

    res.json({
      success: true,
      data: {
        depositHash: result.depositHash,
        amount: result.amount,
        status: result.status,
        estimatedFinality: result.estimatedFinality,
        chain: 'Ethereum Sepolia',
        nextStep: 'Wait for finality (~12-15 minutes), then fetch attestation',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/circle/gateway/attestation/:messageHash
 * Get Gateway attestation for cross-chain transfer
 * Available after source chain finality
 */
router.get('/gateway/attestation/:messageHash', async (req, res) => {
  try {
    const { messageHash } = req.params;

    if (!messageHash) {
      return res.status(400).json({
        success: false,
        error: 'Message hash is required',
      });
    }

    const result = await circleService.getGatewayAttestation(messageHash);

    res.json({
      success: true,
      data: {
        messageHash: result.messageHash,
        attestation: result.attestation,
        status: result.status,
        nextStep: result.attestation
          ? 'Submit attestation to mint USDC on Arc'
          : 'Wait for finality on Sepolia',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/circle/gateway/mint
 * Mint USDC on Arc using Gateway attestation
 * Completes cross-chain transfer
 */
router.post('/gateway/mint', async (req, res) => {
  try {
    const { message, attestation } = req.body;

    if (!message || !attestation) {
      return res.status(400).json({
        success: false,
        error: 'Message and attestation are required',
      });
    }

    const result = await circleService.mintOnArc(message, attestation);

    res.json({
      success: true,
      data: {
        mintHash: result.mintHash,
        amount: result.amount,
        status: result.status,
        chain: 'Arc Testnet',
        nextStep: 'USDC is now available on Arc - deposit to TreasuryVault',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/circle/treasury/deposit
 * Deposit USDC to TreasuryVault on Arc
 * Must be called after minting USDC on Arc via Gateway
 */
router.post('/treasury/deposit', async (req, res) => {
  try {
    const { amount } = req.body;
    const treasuryAddress = process.env.TREASURY_CONTRACT_ADDRESS;

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Amount is required',
      });
    }

    if (!treasuryAddress) {
      return res.status(500).json({
        success: false,
        error: 'TREASURY_CONTRACT_ADDRESS not configured in environment',
      });
    }

    const depositHash = await circleService.depositToTreasury(
      amount,
      treasuryAddress as `0x${string}`
    );

    res.json({
      success: true,
      data: {
        depositHash,
        amount,
        treasuryAddress,
        chain: 'Arc Testnet',
        status: 'complete',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/circle/balance/sepolia/:address
 * Get USDC balance on Ethereum Sepolia
 */
router.get('/balance/sepolia/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const balance = await circleService.getSepoliaBalance(address as `0x${string}`);

    res.json({
      success: true,
      data: {
        balance,
        currency: 'USDC',
        chain: 'Ethereum Sepolia',
        address,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/circle/balance/arc/:address
 * Get USDC balance on Arc Testnet
 */
router.get('/balance/arc/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const balance = await circleService.getArcBalance(address as `0x${string}`);

    res.json({
      success: true,
      data: {
        balance,
        currency: 'USDC',
        chain: 'Arc Testnet',
        address,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/circle/treasury-balance
 * Get TreasuryVault contract balance on Arc (on-chain)
 */
router.get('/treasury-balance', async (req, res) => {
  try {
    const treasuryAddress = process.env.TREASURY_CONTRACT_ADDRESS;

    if (!treasuryAddress) {
      throw new Error('TREASURY_CONTRACT_ADDRESS not configured in environment');
    }

    const balance = await treasuryService.getTreasuryBalance(treasuryAddress);

    res.json({
      success: true,
      data: {
        balance,
        contractAddress: treasuryAddress,
        network: 'arc-testnet',
        currency: 'USDC',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/circle/mock-mint
 * Mock Circle Mint flow: Simulate USD → USDC conversion and deposit to treasury
 * Transfers USDC from a test wallet to the treasury based on selected chain
 */
router.post('/mock-mint', async (req, res) => {
  try {
    const { amount, destinationChain } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Amount is required',
      });
    }

    if (!destinationChain) {
      return res.status(400).json({
        success: false,
        error: 'Destination chain is required',
      });
    }

    const treasuryAddress = process.env.TREASURY_CONTRACT_ADDRESS;
    if (!treasuryAddress) {
      return res.status(500).json({
        success: false,
        error: 'TREASURY_CONTRACT_ADDRESS not configured in environment',
      });
    }

    // Handle different destination chains
    let result;

    if (destinationChain === 'arc') {
      // Arc: Direct deposit to TreasuryVault contract
      // Step 1: Transfer USDC from test wallet to backend wallet (simulates Circle Mint)
      // Step 2: Approve TreasuryVault to spend USDC
      // Step 3: Call depositToTreasury()

      console.log(`[Mock Mint] Depositing ${amount} USDC to TreasuryVault on Arc...`);
      const depositHash = await circleService.depositToTreasury(amount, treasuryAddress as `0x${string}`);

      result = {
        transactionHash: depositHash,
        amount,
        destinationChain: 'Arc Testnet',
        destination: treasuryAddress,
        type: 'treasury_deposit',
      };
    } else if (destinationChain === 'ethereum') {
      // Ethereum: Deposit to Gateway Wallet on Sepolia
      // Step 1: Transfer USDC from test wallet to backend wallet (simulates Circle Mint)
      // Step 2: Approve Gateway Wallet to spend USDC
      // Step 3: Call deposit() on Gateway Wallet

      console.log(`[Mock Mint] Depositing ${amount} USDC to Gateway Wallet on Ethereum Sepolia...`);
      const depositResult = await circleService.depositToGateway(amount);

      result = {
        transactionHash: depositResult.depositHash,
        amount,
        destinationChain: 'Ethereum Sepolia',
        destination: process.env.GATEWAY_WALLET_ADDRESS,
        type: 'gateway_deposit',
        estimatedFinality: depositResult.estimatedFinality,
      };
    } else {
      // Base, Arbitrum, Polygon: Placeholder (coming soon)
      console.log(`[Mock Mint] Placeholder deposit for ${destinationChain} (coming soon)`);
      result = {
        transactionHash: '0x' + '0'.repeat(64), // Mock tx hash
        amount,
        destinationChain: destinationChain.charAt(0).toUpperCase() + destinationChain.slice(1),
        destination: 'Gateway Wallet (placeholder)',
        type: 'gateway_deposit_placeholder',
        note: 'This chain integration is coming soon',
      };
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Mock Mint Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Mock mint failed',
    });
  }
});

export default router;
