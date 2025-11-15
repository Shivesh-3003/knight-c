import { CircleService } from './src/services/circle.service';

const TREASURY_ADDRESS = '0x4094b8392d2Ca5A72185C341b6bbDcBA2f8404a4';

async function main() {
  const circleService = new CircleService();

  console.log('Checking Treasury USDC balance on Arc...');
  console.log('Treasury Address:', TREASURY_ADDRESS);
  console.log('');

  const balance = await circleService.getArcBalance(TREASURY_ADDRESS as `0x${string}`);

  console.log('✅ Treasury USDC Balance:', balance, 'USDC');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
