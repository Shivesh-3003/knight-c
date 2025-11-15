#!/usr/bin/env ts-node
import { config } from 'dotenv';
import axios from 'axios';

config();

async function testCircleAPI() {
  const txHash = '0xdf8f2809b10ce47e9d33569d2d787d791587117c764360b234c0780b2e5d7c7b';
  const circleApiKey = process.env.CIRCLE_API_KEY;

  if (!circleApiKey) {
    console.error('❌ CIRCLE_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('Testing Circle API with transaction hash...\n');
  console.log(`Transaction: ${txHash}`);
  console.log(`API Key: ${circleApiKey.substring(0, 10)}...`);
  console.log('');

  const apiUrl = `https://api.circle.com/v1/w3s/transfers/${txHash}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${circleApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ API Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ API Error:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.message);
    }
  }
}

testCircleAPI();
