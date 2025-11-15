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
 * GET /api/circle/balance/gateway/:address
 * Get Circle Gateway unified USDC balance across all chains
 * This shows the total USDC deposited to Gateway Wallet that can be instantly transferred
 */
router.get('/balance/gateway/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const balance = await circleService.getGatewayBalance(address as `0x${string}`);

    res.json({
      success: true,
      data: {
        balance,
        currency: 'USDC',
        type: 'Unified Balance (Circle Gateway)',
        address,
        note: 'This balance can be instantly transferred to any supported chain',
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
 * GET /api/circle/balance/base/:address
 * Get USDC balance on Base Sepolia
 */
router.get('/balance/base/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const balance = await circleService.getBaseBalance(address as `0x${string}`);

    res.json({
      success: true,
      data: {
        balance,
        currency: 'USDC',
        chain: 'Base Sepolia',
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
 * GET /api/circle/balance/arbitrum/:address
 * Get USDC balance on Arbitrum Sepolia
 */
router.get('/balance/arbitrum/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const balance = await circleService.getArbitrumBalance(address as `0x${string}`);

    res.json({
      success: true,
      data: {
        balance,
        currency: 'USDC',
        chain: 'Arbitrum Sepolia',
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
 * GET /api/circle/balance/polygon/:address
 * Get USDC balance on Polygon Amoy
 */
router.get('/balance/polygon/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const balance = await circleService.getPolygonBalance(address as `0x${string}`);

    res.json({
      success: true,
      data: {
        balance,
        currency: 'USDC',
        chain: 'Polygon Amoy',
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
 * GET /api/circle/balance/avalanche/:address
 * Get USDC balance on Avalanche Fuji
 */
router.get('/balance/avalanche/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const balance = await circleService.getAvalancheBalance(address as `0x${string}`);

    res.json({
      success: true,
      data: {
        balance,
        currency: 'USDC',
        chain: 'Avalanche Fuji',
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

export default router;
