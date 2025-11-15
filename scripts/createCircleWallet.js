// Quick script to create Circle Developer-Controlled Wallet
// Run with: node scripts/createCircleWallet.js

require('dotenv').config();
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');

async function createWallet() {
  console.log('🔵 Creating Circle Developer-Controlled Wallet...\n');

  // Initialize Circle SDK
  const circleClient = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET || '' // May not be needed for testnet
  });

  try {
    // Step 1: Create Wallet Set
    console.log('📦 Step 1: Creating Wallet Set...');
    const walletSetResponse = await circleClient.createWalletSet({
      name: 'Knight-C Treasury Wallet Set'
    });

    const walletSetId = walletSetResponse.data.walletSet.id;
    console.log(`✅ Wallet Set Created: ${walletSetId}\n`);

    // Step 2: Create Wallet on Arc Testnet
    console.log('🔨 Step 2: Creating Wallet on Arc Testnet...');
    const walletResponse = await circleClient.createWallets({
      accountType: 'SCA',
      blockchains: ['ARC-TESTNET'], // Arc Testnet
      count: 1,
      walletSetId: walletSetId
    });

    const wallet = walletResponse.data.wallets[0];
    console.log('✅ Wallet Created!\n');

    // Output the wallet details
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 WALLET DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Wallet ID:       ${wallet.id}`);
    console.log(`Wallet Address:  ${wallet.address}`);
    console.log(`Blockchain:      ${wallet.blockchain}`);
    console.log(`Account Type:    ${wallet.accountType}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 Add this to your .env file:');
    console.log(`CIRCLE_WALLET_ADDRESS=${wallet.address}\n`);

    console.log('✨ Done! You can now deploy your contract.');

  } catch (error) {
    console.error('❌ Error creating wallet:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

createWallet();
