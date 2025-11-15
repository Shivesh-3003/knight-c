// Treasury Vault Contract Address
// This should be updated after deploying to Arc Testnet
export const treasuryVaultAddress =
  (import.meta.env.VITE_TREASURY_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(treasuryVaultAddress)) {
  console.warn(
    "⚠️ Invalid treasury address. Please set VITE_TREASURY_ADDRESS in .env"
  );
}
