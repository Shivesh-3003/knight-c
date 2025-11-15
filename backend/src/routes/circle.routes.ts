import { Router } from 'express';
import { CircleService } from '../services/circle.service';
import { TreasuryService } from '../services/treasury.service';

const router = Router();
const circleService = new CircleService();
const treasuryService = new TreasuryService();

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

// ===== FRONTEND-REQUIRED ENDPOINTS =====

// Get treasury balance (on-chain)
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
        currency: 'USDC'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deposit USD/USDC to TreasuryVault contract via Circle Mint
router.post('/deposit', async (req, res) => {
  try {
    const { amount } = req.body;
    const treasuryAddress = process.env.TREASURY_CONTRACT_ADDRESS;

    if (!treasuryAddress) {
      throw new Error('TREASURY_CONTRACT_ADDRESS not configured');
    }

    // Transfer USDC from Circle wallet to TreasuryVault contract
    const result = await circleService.depositToContract(amount, treasuryAddress);

    res.json({
      success: true,
      data: {
        transferId: result.id,
        amount,
        status: result.status || 'pending',
        destination: treasuryAddress,
        chain: 'ARC',
        estimatedCompletion: new Date(Date.now() + 60000).toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Withdraw USDC → fiat
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, bankAccountId } = req.body;
    const treasuryAddress = process.env.TREASURY_CONTRACT_ADDRESS;

    if (!treasuryAddress) {
      throw new Error('TREASURY_CONTRACT_ADDRESS not configured');
    }

    if (!bankAccountId) {
      throw new Error('bankAccountId is required for withdrawals');
    }

    // Withdraw USDC from Circle wallet to bank account
    const result = await circleService.withdrawFromContract(amount, bankAccountId, treasuryAddress);

    res.json({
      success: true,
      data: {
        transferId: result.id,
        amount,
        status: result.status || 'pending',
        bankAccountId
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

    // Query Circle API for transfer status
    const result = await circleService.getTransferStatus(transferId);

    res.json({
      success: true,
      data: {
        transferId: result.id,
        status: result.status,
        source: result.source,
        destination: result.destination,
        amount: result.amount,
        createDate: result.createDate,
        updateDate: result.updateDate
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Circle wallet balance (available USDC for deposits)
router.get('/balance', async (req, res) => {
  try {
    const result = await circleService.getCircleWalletBalance();

    res.json({
      success: true,
      data: {
        walletId: result.id,
        balance: result.balances?.[0]?.amount || '0',
        currency: 'USDC',
        blockchain: result.blockchain,
        address: result.address
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;