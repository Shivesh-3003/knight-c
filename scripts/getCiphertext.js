// Get encrypted ciphertext to register in Circle Console
// Run with: node scripts/getCiphertext.js

require('dotenv').config();
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');

async function getCiphertext() {
  console.log('🔐 Getting Entity Secret Ciphertext...\n');

  if (!process.env.CIRCLE_ENTITY_SECRET) {
    console.error('❌ CIRCLE_ENTITY_SECRET not found in .env');
    console.log('Run: node scripts/initEntitySecret.js first');
    process.exit(1);
  }

  const circleClient = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET
  });

  try {
    // Get the public key which contains the ciphertext
    const response = await circleClient.getPublicKey();

    console.log('✅ Successfully retrieved ciphertext!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 COPY THIS CIPHERTEXT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (response.data && response.data.publicKey) {
      console.log(response.data.publicKey);
    } else {
      console.log(JSON.stringify(response.data, null, 2));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 NEXT STEPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to https://console.circle.com');
    console.log('2. Navigate to Developer-Controlled Wallets → Settings');
    console.log('3. Find "Entity Secret" or "Encryption" section');
    console.log('4. Paste the ciphertext above');
    console.log('5. Save/Submit');
    console.log('6. Then run: node scripts/createCircleWallet.js');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error getting ciphertext:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }

    console.log('\n💡 This might mean the entity secret setup requires console access first.');
    console.log('Try visiting: https://console.circle.com/wallets/dev/configurator');

    process.exit(1);
  }
}

getCiphertext();
