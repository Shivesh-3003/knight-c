// Initialize Circle Entity Secret (one-time setup)
// Run with: node scripts/initEntitySecret.js

require('dotenv').config();
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');
const crypto = require('crypto');

async function initializeEntitySecret() {
  console.log('🔐 Initializing Circle Entity Secret...\n');

  // Generate a random 32-byte hex string as entity secret
  const entitySecret = crypto.randomBytes(32).toString('hex');
  console.log('✅ Generated Entity Secret (save this securely!)');
  console.log(`Entity Secret: ${entitySecret}\n`);

  // Initialize Circle SDK with the new entity secret
  const circleClient = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY,
    entitySecret: entitySecret
  });

  try {
    console.log('📤 Acquiring session token from Circle...');

    // This call initializes the entity secret with Circle
    // It will return a session token and register the entity secret
    const response = await circleClient.getPublicKey();

    console.log('✅ Entity Secret initialized successfully!\n');

    // Output instructions
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 NEXT STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Add this to your .env file:\n');
    console.log(`CIRCLE_ENTITY_SECRET=${entitySecret}\n`);
    console.log('2. Keep this secret secure! Do NOT commit to git.');
    console.log('3. Now run: node scripts/createCircleWallet.js');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error initializing entity secret:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.log('\n💡 Troubleshooting:');
    console.log('- Make sure your CIRCLE_API_KEY is correct and for Developer-Controlled Wallets');
    console.log('- Check that you have the latest API key from console.circle.com');
    process.exit(1);
  }
}

initializeEntitySecret();
