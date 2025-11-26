# TetriChain Game Server - Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Redis server
- Sui wallet and testnet tokens (for blockchain integration)

## Quick Start

### 1. Install Dependencies

```bash
cd tetrichain/server
npm install
```

### 2. Set Up Redis

**Option A: Local Redis (Development)**

Windows (with Chocolatey):
```bash
choco install redis-64
redis-server
```

macOS (with Homebrew):
```bash
brew install redis
brew services start redis
```

Linux:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Option B: Cloud Redis (Production)**
- Use Redis Cloud, AWS ElastiCache, or similar service
- Update `.env` with connection details

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
PORT=3001
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Sui Blockchain (update after contract deployment)
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
PACKAGE_ID=<your_package_id>
BATTLE_MANAGER_ID=<your_battle_manager_id>
USERNAME_REGISTRY_ID=<your_username_registry_id>

# CORS (add your frontend URL)
ALLOWED_ORIGINS=http://localhost:5173
```

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## Verify Installation

1. Check health endpoint:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "connectedPlayers": 0,
  "matchmakingQueue": 0
}
```

2. Check metrics endpoint:
```bash
curl http://localhost:3001/metrics
```

## Testing WebSocket Connection

You can test the WebSocket connection using the browser console:

```javascript
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected!');
  
  // Authenticate
  socket.emit('auth', {
    walletAddress: '0x123...',
    username: 'TestPlayer'
  });
});

socket.on('auth:success', (data) => {
  console.log('Authenticated:', data);
});
```

## Architecture Overview

```
tetrichain/server/
├── src/
│   ├── config/           # Configuration
│   ├── middleware/       # Express middleware
│   ├── models/          # TypeScript interfaces
│   ├── services/        # Core services
│   │   ├── SocketManager.ts      # WebSocket management
│   │   ├── MatchmakingService.ts # Player matchmaking
│   │   ├── RoomManager.ts        # Battle room management
│   │   ├── GameStateSync.ts      # Real-time game sync
│   │   ├── BlockchainService.ts  # Sui blockchain integration
│   │   ├── MetricsService.ts     # Server metrics
│   │   └── RedisClient.ts        # Redis connection
│   ├── utils/           # Utilities (logger, etc.)
│   └── index.ts         # Application entry point
├── logs/                # Log files (production)
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## Next Steps

1. **Deploy Smart Contract**: Update the Move contract with multiplayer modules (BattleManager, UsernameRegistry, etc.)
2. **Update Config**: Add deployed contract addresses to `.env`
3. **Connect Frontend**: Update frontend to connect to WebSocket server
4. **Test End-to-End**: Test complete battle flow with two clients

## Troubleshooting

### Redis Connection Error
- Ensure Redis is running: `redis-cli ping` (should return "PONG")
- Check Redis host/port in `.env`

### Port Already in Use
- Change `PORT` in `.env` to a different port
- Or kill the process using port 3001

### TypeScript Compilation Errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version: `node --version` (should be 18+)

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name tetrichain-server
   ```
3. Set up SSL/TLS for WebSocket connections
4. Configure Redis persistence
5. Set up monitoring and alerting

## Support

For issues or questions, check the main project documentation or create an issue in the repository.
