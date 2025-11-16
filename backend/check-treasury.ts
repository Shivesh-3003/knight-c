// Load environment variables from the root .env file
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { CircleService } from './src/services/circle.service';

const TREASURY_CONTRACT_ADDRESS = process.env.TREASURY_CONTRACT_ADDRESS || '0x9e347f606F542739741223A0DB6a1Cce81A1eEE9';

async function main() {
  const circleService = new CircleService();

  console.log('Checking Treasury USDC balance on Arc...');
  console.log('Treasury Address:', TREASURY_CONTRACT_ADDRESS);
  console.log('');

  const balance = await circleService.getArcBalance(TREASURY_CONTRACT_ADDRESS as `0x${string}`);

  console.log('✅ Treasury USDC Balance:', balance, 'USDC');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
