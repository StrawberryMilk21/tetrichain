import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  sui: {
    rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443',
    packageId: process.env.PACKAGE_ID || '',
    battleManagerId: process.env.BATTLE_MANAGER_ID || '',
    usernameRegistryId: process.env.USERNAME_REGISTRY_ID || '',
    marketplaceId: process.env.MARKETPLACE_ID || '',
  },
  
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },
  
  game: {
    matchmakingTimeout: 30000, // 30 seconds
    disconnectGracePeriod: 10000, // 10 seconds
    wagerMatchTolerance: 0.2, // 20% tolerance for matchmaking
  },
};
