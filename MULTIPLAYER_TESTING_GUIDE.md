# TetriChain Multiplayer - Testing & Deployment Guide

## Overview

This guide covers testing and deploying the TetriChain multiplayer system. Complete these steps to validate the implementation before adding the NFT marketplace.

## Prerequisites

### Required Software
- Node.js 18+ and npm
- Redis server (local or cloud)
- Sui CLI and wallet
- Two browser windows/devices for multiplayer testing

### Environment Setup

1. **Server Environment** (`tetrichain/server/.env`):
```env
PORT=3001
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Sui Blockchain
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
PACKAGE_ID=<your_deployed_package_id>
BATTLE_MANAGER_ID=<your_battle_manager_id>
USERNAME_REGISTRY_ID=<your_username_registry_id>

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

2. **Client Environment** (create `tetrichain/client/.env`):
```env
VITE_SOCKET_SERVER_URL=http://localhost:3001
```

## Phase 7: Integration & Testing

### 7.1 Test Complete Battle Flow

#### Setup
1. Start Redis:
```bash
redis-server
```

2. Start game server:
```bash
cd tetrichain/server
npm run dev
```

3. Start client (in two separate terminals):
```bash
cd tetrichain/client
npm run dev
```

4. Open two browser windows:
   - Window 1: http://localhost:5173
   - Window 2: http://localhost:5173 (or use incognito mode)

#### Test Steps

**A. Wallet Connection & Username Registration**
- [ ] Connect wallet in both windows
- [ ] Register unique usernames for both accounts
- [ ] Verify usernames appear in profile section
- [ ] Check that duplicate username is rejected

**B. Random Matchmaking**
- [ ] Window 1: Navigate to Multiplayer menu
- [ ] Select "Random Matchmaking"
- [ ] Set wager amount (e.g., 10 TETRI)
- [ ] Click "Start Matchmaking"
- [ ] Window 2: Join matchmaking with similar wager
- [ ] Verify both players are matched
- [ ] Confirm countdown appears (3-2-1-GO)
- [ ] Battle starts automatically

**C. Battle Gameplay**
- [ ] Both players can move pieces (←→↓ Space)
- [ ] Opponent's board updates in real-time
- [ ] Clear lines and verify garbage is sent
- [ ] Garbage appears on opponent's board
- [ ] Network latency indicator shows connection quality
- [ ] Game over when one player's board fills
- [ ] Winner is correctly identified
- [ ] Battle result modal shows correct stats

**D. Token Transfer**
- [ ] Winner receives both wagers
- [ ] Loser's balance decreases by wager amount
- [ ] Transaction appears on blockchain
- [ ] Balances update in UI

### 7.2 Test Matchmaking System

#### Test Cases

**A. Similar Wager Matching**
- [ ] Player 1: Join with 10 TETRI wager
- [ ] Player 2: Join with 10 TETRI wager
- [ ] Players are matched immediately
- [ ] Player 3: Join with 100 TETRI wager
- [ ] Player 3 is NOT matched with Players 1&2

**B. Wager Tolerance (±20%)**
- [ ] Player 1: Join with 100 TETRI
- [ ] Player 2: Join with 85 TETRI (15% difference)
- [ ] Players are matched (within tolerance)
- [ ] Player 3: Join with 100 TETRI
- [ ] Player 4: Join with 75 TETRI (25% difference)
- [ ] Players 3&4 are NOT matched (outside tolerance)

**C. Matchmaking Timeout**
- [ ] Join matchmaking alone
- [ ] Wait 30 seconds
- [ ] Verify timeout notification appears
- [ ] Player is removed from queue

**D. Cancel Matchmaking**
- [ ] Join matchmaking
- [ ] Click "Cancel" button
- [ ] Verify player is removed from queue
- [ ] Can rejoin matchmaking

### 7.3 Test Private Rooms

#### Test Cases

**A. Room Creation**
- [ ] Click "Private Room"
- [ ] Click "Create Room"
- [ ] Set wager amount
- [ ] Room key is generated (6 characters)
- [ ] Room key is displayed prominently
- [ ] Copy button works

**B. Room Joining**
- [ ] Window 2: Click "Private Room"
- [ ] Click "Join Room"
- [ ] Enter room key from Window 1
- [ ] Successfully joins room
- [ ] Both players see each other

**C. Ready System**
- [ ] Both players click "Ready"
- [ ] Countdown starts (3-2-1-GO)
- [ ] Battle begins

**D. Room Errors**
- [ ] Try joining with invalid room key
- [ ] Error message appears
- [ ] Try joining full room
- [ ] Error message appears

### 7.4 Test Username Registration

#### Test Cases

**A. Valid Registration**
- [ ] Enter username "PLAYER123"
- [ ] Validation passes (green checkmarks)
- [ ] Submit to blockchain
- [ ] Username registered successfully
- [ ] Username appears in profile

**B. Invalid Usernames**
- [ ] Try "AB" (too short) - rejected
- [ ] Try "VERYLONGUSERNAME123" (too long) - rejected
- [ ] Try "PLAYER@123" (special chars) - rejected
- [ ] Try "player 123" (spaces) - rejected

**C. Duplicate Username**
- [ ] Register "TESTUSER" on account 1
- [ ] Try to register "TESTUSER" on account 2
- [ ] Error: "Username already taken"

**D. Username Display**
- [ ] Username shows in WalletStatus
- [ ] Username shows in leaderboard
- [ ] Username shows in battle view
- [ ] Username used in WebSocket auth

### 7.5 Test NFT Marketplace (Placeholder)

**Note:** Phase 6 (NFT Marketplace) is not yet implemented. For now:
- [ ] Marketplace button shows "Coming soon" message
- [ ] No errors when clicking marketplace
- [ ] Can return to main menu

### 7.6 Test Network Resilience

#### Test Cases

**A. Disconnection During Battle**
- [ ] Start a battle
- [ ] Disconnect one player (close browser tab)
- [ ] Wait 10 seconds
- [ ] Verify forfeit is declared
- [ ] Other player wins by forfeit

**B. Reconnection**
- [ ] Start a battle
- [ ] Disconnect one player briefly
- [ ] Reconnect within 10 seconds
- [ ] Battle continues normally

**C. Server Restart**
- [ ] Start a battle
- [ ] Restart game server
- [ ] Clients attempt to reconnect
- [ ] Verify reconnection logic works

**D. High Latency**
- [ ] Simulate high latency (browser dev tools)
- [ ] Network indicator shows red/poor
- [ ] Lag warning appears
- [ ] Game still playable

### 7.7 Performance Testing

#### Test Cases

**A. Multiple Concurrent Battles**
- [ ] Start 3-5 battles simultaneously
- [ ] All battles run smoothly
- [ ] No lag or delays
- [ ] Server metrics show healthy stats

**B. WebSocket Latency**
- [ ] Check network indicator during battle
- [ ] Latency should be <100ms (good)
- [ ] State sync happens within 200ms
- [ ] No noticeable delay in opponent moves

**C. Garbage Line Performance**
- [ ] Clear 4 lines (Tetris)
- [ ] 4 garbage lines sent
- [ ] Opponent receives within 1 second
- [ ] No visual glitches

**D. Long Battle Duration**
- [ ] Play a 10+ minute battle
- [ ] No memory leaks
- [ ] Performance stays consistent
- [ ] No disconnections

## Common Issues & Solutions

### Server Won't Start

**Issue:** Redis connection error
```
Solution: Ensure Redis is running
- Windows: redis-server
- Mac: brew services start redis
- Linux: sudo systemctl start redis
```

**Issue:** Port 3001 already in use
```
Solution: Change PORT in .env or kill process
- Windows: netstat -ano | findstr :3001
- Mac/Linux: lsof -ti:3001 | xargs kill
```

### Client Issues

**Issue:** WebSocket connection failed
```
Solution: 
1. Check server is running
2. Verify VITE_SOCKET_SERVER_URL in .env
3. Check CORS settings in server
```

**Issue:** Username registration fails
```
Solution:
1. Ensure wallet has SUI for gas
2. Check USERNAME_REGISTRY_ID in config
3. Verify smart contract is deployed
```

### Gameplay Issues

**Issue:** Opponent's board not updating
```
Solution:
1. Check WebSocket connection
2. Verify both players in same room
3. Check server logs for errors
```

**Issue:** Garbage lines not appearing
```
Solution:
1. Verify garbage calculation (1→0, 2→1, 3→2, 4→4)
2. Check server GameStateSync logs
3. Ensure addGarbageLines() is called
```

## Deployment Checklist

### Smart Contract Deployment

- [ ] Deploy updated Move contract with:
  - BattleManager module
  - UsernameRegistry module
  - NFTMarketplace module (for Phase 6)
- [ ] Record package ID
- [ ] Record shared object IDs
- [ ] Update config.js with new IDs
- [ ] Test contract functions on testnet

### Server Deployment

- [ ] Set up cloud hosting (AWS/GCP/Heroku)
- [ ] Configure Redis instance (cloud or managed)
- [ ] Set environment variables
- [ ] Enable SSL/TLS for WebSocket
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Deploy server
- [ ] Test health endpoint

### Client Deployment

- [ ] Update VITE_SOCKET_SERVER_URL for production
- [ ] Update contract IDs in config.js
- [ ] Build production bundle: `npm run build`
- [ ] Deploy to hosting (Vercel/Netlify/etc.)
- [ ] Test on production domain
- [ ] Verify WebSocket connection works

### Post-Deployment Testing

- [ ] Test from different devices
- [ ] Test from different networks
- [ ] Verify blockchain transactions
- [ ] Check server metrics
- [ ] Monitor error logs
- [ ] Test with real users

## Success Criteria

All tests pass when:
- ✅ Two players can connect and authenticate
- ✅ Matchmaking pairs players correctly
- ✅ Private rooms work end-to-end
- ✅ Battles run smoothly with real-time sync
- ✅ Garbage lines work correctly
- ✅ Game over detection is accurate
- ✅ Winner receives tokens on blockchain
- ✅ Usernames display everywhere
- ✅ Network resilience handles disconnections
- ✅ Performance is acceptable under load

## Next Steps

After all Phase 7 tests pass:
1. ✅ Mark Phase 7 as complete
2. 🎯 Implement Phase 6 (NFT Marketplace)
3. 🚀 Deploy to production
4. 📊 Monitor and optimize
5. 🎮 Launch to users!

## Support

For issues during testing:
1. Check server logs: `tetrichain/server/logs/`
2. Check browser console for client errors
3. Verify Redis is running: `redis-cli ping`
4. Check WebSocket connection in Network tab
5. Review this guide's troubleshooting section
