/**
 * TetriChain Configuration
 * 
 * This file contains all the blockchain configuration for the TetriChain game.
 * Update these values after deploying the smart contract.
 */

// OneChain Testnet Configuration (Sui-compatible)
export const NETWORK = 'onechain-testnet';
export const RPC_URL = 'https://rpc-testnet.onelabs.cc:443';

// WebSocket Server Configuration
export const WEBSOCKET_CONFIG = {
    serverUrl: import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001',
};

// Deployed Contract Addresses (OneChain Testnet)
export const CONTRACT_CONFIG = {
    // Package ID - the deployed smart contract package
    packageId: '0x8b5ce060fabd9c448c54ae4b98353616b134bc6d6b4ee01bf5c7a54eac56ea51',
    
    // Shared Objects - required for transactions
    leaderboardId: '0x61fa2e0b767048a95aece77d7f5f8983eeaefb14cfaf1c3dc894c48d6702eca1',
    treasuryId: '0xd0175f31d000cd4256b2c8c266380dab6b757f5c3328d2faa004320536e1aec6',
    usernameRegistryId: '0xcd3ad59b9810963d90c66142a633c7b7c4034ca00d1d6385afa1414bdfb9998c',
    marketplaceId: '0xc7d68b5e8dfaa12bc7db8215b1ac561ae0ad310a2f96a0b6e2b4ae44bae695db',
    
    // System Objects - Sui built-in objects
    randomId: '0x8',  // Sui Random object
    clockId: '0x6',   // Sui Clock object
    
    // Module name
    moduleName: 'game',
    
    // Token Information
    token: {
        type: '0x8b5ce060fabd9c448c54ae4b98353616b134bc6d6b4ee01bf5c7a54eac56ea51::game::GAME',
        symbol: 'TETRI',
        name: 'TetriChain Token',
        decimals: 0,  // Token has no decimals - raw balance is display balance
    }
};

// Transaction Configuration
export const TX_CONFIG = {
    // Gas budget for transactions (in MIST, 1 SUI = 1,000,000,000 MIST)
    createSeedGasBudget: 10_000_000,      // 0.01 SUI
    submitScoreGasBudget: 20_000_000,     // 0.02 SUI
    queryGasBudget: 5_000_000,            // 0.005 SUI
};

// Game Configuration
export const GAME_CONFIG = {
    // Score validation
    maxScore: 999_999,
    minScore: 0,
    
    // Token reward formula: tokens = score / 100
    tokenRewardDivisor: 100,
    
    // Leaderboard
    leaderboardSize: 10,
};

// Explorer URLs
export const EXPLORER_URL = 'https://explorer.onelabs.cc';

export function getPackageUrl() {
    return `${EXPLORER_URL}/package/${CONTRACT_CONFIG.packageId}`;
}

export function getObjectUrl(objectId) {
    return `${EXPLORER_URL}/object/${objectId}`;
}

export function getTxUrl(txDigest) {
    return `${EXPLORER_URL}/txblock/${txDigest}`;
}

export function getAddressUrl(address) {
    return `${EXPLORER_URL}/account/${address}`;
}
