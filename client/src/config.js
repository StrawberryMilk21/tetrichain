/**
 * TetriChain Configuration
 * 
 * This file contains all the blockchain configuration for the TetriChain game.
 * Update these values after deploying the smart contract.
 */

// Sui Network Configuration
export const NETWORK = 'testnet';
export const RPC_URL = 'https://fullnode.testnet.sui.io:443';

// WebSocket Server Configuration
export const WEBSOCKET_CONFIG = {
    serverUrl: import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001',
};

// Deployed Contract Addresses
export const CONTRACT_CONFIG = {
    // Package ID - the deployed smart contract package (Updated for Multiplayer)
    packageId: '0x4bf5f75d851120181674181a8a6048f4d1a7980a3e8e529f18f23f5cbf41f8b7',
    
    // Shared Objects - required for transactions
    leaderboardId: '0xf1b0f2e1dc255b865878d527d32f731ca2b189c5c28a2a644e7dc51425449f28',
    treasuryId: '0xd0b57ab010a2a6f2976dd151afc5009e234b64019d7a2a584221bc8d5d936944',
    usernameRegistryId: '0x68bbdeb830d13734575943a863e86850e882c8afd7df4fe57780431ad232464f',
    marketplaceId: '0x1f5d93361cd9b6bb32de1000798d8d581603ca6e19a905700548731a5884beea',
    
    // System Objects - Sui built-in objects
    randomId: '0x8',  // Sui Random object
    clockId: '0x6',   // Sui Clock object
    
    // Module name
    moduleName: 'game',
    
    // Token Information
    token: {
        type: '0x4bf5f75d851120181674181a8a6048f4d1a7980a3e8e529f18f23f5cbf41f8b7::game::GAME',
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
export const EXPLORER_URL = 'https://testnet.suivision.xyz';

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
