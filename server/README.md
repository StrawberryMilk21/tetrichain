# TetriChain Game Server

Real-time multiplayer game server for TetriChain using WebSockets and Redis.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - Redis connection details (install Redis locally or use a cloud service)
   - Sui blockchain RPC URL
   - Smart contract addresses (after deploying the updated contract)

4. Start Redis (if running locally):
```bash
# On Windows with Chocolatey
choco install redis-64
redis-server

# On macOS with Homebrew
brew install redis
brew services start redis

# On Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

## Production

Run the compiled server:
```bash
npm start
```

## Project Structure

```
src/
├── config/         # Configuration and environment variables
├── models/         # TypeScript interfaces and data models
├── services/       # Business logic services
│   ├── MatchmakingService.ts
│   ├── RoomManager.ts
│   ├── GameStateSync.ts
│   └── BlockchainService.ts
├── routes/         # HTTP routes (if needed)
├── utils/          # Utility functions and helpers
└── index.ts        # Application entry point
```

## WebSocket Events

### Client → Server
- `matchmaking:join` - Join matchmaking queue
- `matchmaking:cancel` - Leave matchmaking queue
- `room:create` - Create private room
- `room:join` - Join room by key
- `game:move` - Send piece movement
- `game:rotate` - Send piece rotation
- `game:drop` - Send hard drop
- `game:lines_cleared` - Notify lines cleared

### Server → Client
- `matchmaking:found` - Match found
- `room:created` - Room created with key
- `room:joined` - Successfully joined room
- `game:start` - Battle countdown/start
- `game:state_update` - Opponent's board state
- `game:garbage_incoming` - Garbage lines incoming
- `game:end` - Battle ended with winner
