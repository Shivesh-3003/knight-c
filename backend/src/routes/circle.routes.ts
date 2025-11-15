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

export default router;