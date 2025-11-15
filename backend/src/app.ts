import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import circleRoutes from './routes/circle.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8082',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/circle', circleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Knight-C Backend',
    config: {
      circleApi: process.env.CIRCLE_API_KEY ? 'Configured ✅' : 'Missing ❌',
      treasuryContract: process.env.TREASURY_CONTRACT_ADDRESS ? 'Configured ✅' : 'Missing ❌',
      arcRpc: process.env.ARC_TESTNET_RPC_URL ? 'Configured ✅' : 'Missing ❌',
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Knight-C Backend Server`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Circle API routes: http://localhost:${PORT}/api/circle`);
  console.log(`\n⏰ Started at ${new Date().toISOString()}\n`);
});

export default app;
