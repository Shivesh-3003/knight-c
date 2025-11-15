import { Router } from 'express';
import { CircleService } from '../services/circle.service';
import { BridgeKitService } from '../services/bridgeKit.service';

const router = Router();
const circleService = new CircleService();
const bridgeKitService = new BridgeKitService();

// On-ramp: USD → USDC
router.post('/mint', async (req, res) => {
  try {
    const { amount, walletId } = req.body;
    const result = await circleService.mintUSDC(amount, walletId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Off-ramp: USDC → USD
router.post('/redeem', async (req, res) => {
  try {
    const { amount, walletId, bankAccountId } = req.body;
    const result = await circleService.redeemUSDC(amount, walletId, bankAccountId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cross-chain transfer
router.post('/cross-chain', async (req, res) => {
  try {
    const { amount, destinationAddress, destinationChain } = req.body;
    const result = await bridgeKitService.transferCrossChain(amount, destinationAddress, destinationChain);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get wallet balance
router.get('/balance/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const result = await circleService.getWalletBalance(walletId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create treasury wallet
router.post('/create-wallet', async (req, res) => {
  try {
    const result = await circleService.createTreasuryWallet();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== FRONTEND-REQUIRED ENDPOINTS =====

// Get treasury balance (on-chain)
router.get('/treasury-balance', async (req, res) => {
  try {
    // For now, return mock data since we need Web3 integration
    // TODO: Implement actual on-chain balance query using viem
    const treasuryAddress = process.env.VITE_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000';

    res.json({
      success: true,
      data: {
        balance: '0', // TODO: Query actual balance from Arc RPC
        address: treasuryAddress,
        currency: 'USDC'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deposit fiat → USDC
router.post('/deposit', async (req, res) => {
  try {
    const { amount, currency, destinationType } = req.body;

    // TODO: Implement actual Circle deposit logic
    res.json({
      success: true,
      data: {
        transferId: `transfer_${Date.now()}`,
        amount,
        currency,
        status: 'pending'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Withdraw USDC → fiat
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, bankAccountId, source } = req.body;

    // TODO: Implement actual Circle withdraw logic
    res.json({
      success: true,
      data: {
        transferId: `withdraw_${Date.now()}`,
        amount,
        status: 'pending'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Transfer USDC to Arc contract
router.post('/transfer-to-arc', async (req, res) => {
  try {
    const { amount } = req.body;

    // TODO: Implement actual transfer to Arc logic
    res.json({
      success: true,
      data: {
        transferId: `arc_${Date.now()}`,
        amount,
        status: 'pending'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get transfer status
router.get('/transfer-status/:transferId', async (req, res) => {
  try {
    const { transferId } = req.params;

    // TODO: Implement actual status lookup
    res.json({
      success: true,
      data: {
        transferId,
        status: 'complete', // Mock: complete status
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Circle wallet balance
router.get('/balance', async (req, res) => {
  try {
    // TODO: Implement with actual Circle wallet ID
    res.json({
      success: true,
      data: {
        balance: '0',
        currency: 'USDC'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;