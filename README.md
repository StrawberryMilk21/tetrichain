# 🎮 TetriChain

**A Web3 Tetris Game on Sui Blockchain**

[Features](#-key-features) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Live Demo](#-live-demo)

---

## 📖 Project Overview

TetriChain is a fully decentralized Tetris game built on the Sui blockchain. Players can enjoy classic Tetris gameplay while earning TETRI tokens, collecting NFT skins, competing on global leaderboards, and battling other players in real-time multiplayer matches. All game scores and NFT assets are stored on-chain, ensuring true ownership, transparency, and provably fair gameplay.

**Experience the nostalgia of Tetris with the power of Web3 technology!**

---

## 🎬 Live Demo

| Platform | Link |
|----------|------|
| 🌐 **Live Web App** | [Play TetriChain](#) |
| 🎥 **YouTube Demo** | [Watch Demo Video](#) |
| 📦 **Smart Contract** | [View on SuiScan](https://testnet.suivision.xyz/package/0x9fb6a73cd68dfb1821ab456982e6c9256546a8ecd29cd14bd7b803a2e3c9eb37) |

---

## ✨ Key Features

### 🎯 Classic Tetris Gameplay
- **Smooth 60fps gameplay** with responsive controls
- **7 classic Tetromino pieces** (I, O, T, S, Z, J, L)
- **Progressive difficulty** - speed increases with level
- **Score system** - 100/300/500/800 points for 1/2/3/4 lines
- **Level progression** - level up every 10 lines cleared
- **Hold piece** - save a piece for later (press C)
- **Ghost piece** - preview where piece will land
- **Pause/Resume** - press P to pause

### ⛓️ Blockchain Integration
- **Provably Fair** - blockchain-generated seeds ensure fair piece generation
- **On-Chain Leaderboard** - top 10 scores stored permanently on Sui
- **Play-to-Earn** - earn TETRI tokens based on your score (score ÷ 100)
- **Wallet Integration** - seamless OneWallet connection via @mysten/dapp-kit
- **Score Verification** - all scores validated on-chain
- **Token Rewards** - instant token minting upon score submission

### 🎨 NFT Skin System
- **20 Unique Skins** - unlock skins by achieving milestones
- **Multiple Unlock Types**:
  - 💰 Score-based (1K, 5K, 10K, 25K, 50K, 100K points)
  - 📊 Level-based (Level 5, 8, 10, 12, 15)
  - 📏 Lines-based (50, 100, 200, 300 lines cleared)
  - 🎯 Tetris-based (5, 10 four-line clears)
  - 🔥 Combo-based (4x, 6x combos)
- **Claim as NFTs** - mint your unlocked skins as blockchain NFTs
- **NFT Marketplace** - buy and sell skin NFTs with other players
- **Customization** - personalize your Tetris blocks

### 👥 Multiplayer System
- **Real-Time Battles** - compete head-to-head with other players
- **Matchmaking** - automatic opponent matching
- **Private Rooms** - create custom rooms with room codes
- **Live Game Sync** - see opponent's board in real-time
- **Garbage Lines** - send attack lines to opponents
- **Battle Wagers** - bet TETRI tokens on matches
- **WebSocket Technology** - low-latency real-time communication

### 🏆 Competitive Features
- **Global Leaderboard** - compete for top 10 positions
- **Username System** - register unique usernames (3-16 characters)
- **Player Profiles** - track your stats and achievements
- **Battle History** - view past multiplayer matches
- **Token Balance** - monitor your TETRI earnings
- **Combo System** - chain line clears for higher scores

### 🎵 Immersive Experience
- **Retro-Futuristic UI** - cyberpunk neon aesthetic with animations
- **Sound Effects** - piece movement, rotation, line clear, and game over sounds
- **Background Music** - toggle music on/off
- **Smooth Animations** - piece locking, line clearing, level up effects
- **Responsive Design** - works on desktop and mobile
- **Toast Notifications** - smooth slide-in/out notifications

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    Game     │  │  Blockchain │  │ Multiplayer │              │
│  │   Engine    │  │ Integration │  │   Battle    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ NFT Skins   │  │ Marketplace │  │  Username   │              │
│  │   System    │  │    View     │  │   System    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Sui Blockchain │  │  WebSocket      │  │   Browser       │
│  (Move Smart    │  │  Server         │  │   Storage       │
│   Contracts)    │  │  (Node.js)      │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                    │                    │
        │                    │                    │
        ▼                    ▼                    ▼
   Game Seeds          Multiplayer           Skin Unlocks
   Leaderboard         Matchmaking           Preferences
   Token Rewards       Battle Sync           Game State
   NFT Skins           Room Manager
   Marketplace
   Usernames
```

### Architecture Components

**Frontend (React)**
- **Game Engine** - TetrisGame class with deterministic piece generation
- **React Hooks** - useGame, useBlockchain, useSkinNFT, useWebSocket
- **Canvas Rendering** - 60fps game loop with requestAnimationFrame
- **State Management** - React hooks + local storage
- **Wallet Integration** - @mysten/dapp-kit for Sui wallet connection

**Backend (Node.js + TypeScript)**
- **WebSocket Server** - Socket.io for real-time multiplayer
- **Matchmaking Service** - automatic player pairing
- **Room Manager** - private room creation and management
- **Game State Sync** - real-time board synchronization
- **Battle Manager** - wager handling and winner determination

**Blockchain (Sui Move)**
- **Game Seeds** - provably fair random seed generation
- **Leaderboard** - top 10 scores with player addresses
- **Token System** - TETRI token minting and transfers
- **NFT Skins** - BlockSkin NFTs with customizable colors
- **Marketplace** - peer-to-peer NFT trading with 2.5% fee
- **Username Registry** - unique username registration
- **Battle Escrow** - secure wager management

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks |
| **Vite** | Fast build tool and dev server |
| **@mysten/dapp-kit** | Sui wallet integration |
| **@mysten/sui** | Sui blockchain SDK |
| **Socket.io Client** | Real-time multiplayer communication |
| **Canvas API** | High-performance game rendering |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **TypeScript** | Type-safe development |
| **Express** | Web server framework |
| **Socket.io** | WebSocket server |
| **Winston** | Logging |

### Blockchain

| Technology | Purpose |
|------------|---------|
| **Sui Network** | Layer 1 blockchain (Testnet) |
| **Move Language** | Smart contract development |
| **OneWallet** | Wallet connection |
| **Sui Random** | On-chain randomness |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Kiro IDE** | AI-powered development environment |
| **Vitest** | Unit testing framework |
| **Fast-check** | Property-based testing |

---

## 🔗 Important Endpoints

### Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with wallet connection |
| `/solo` | Single-player Tetris mode |
| `/multiplayer` | Multiplayer battle mode |
| `/customization` | Skin selection and NFT claiming |
| `/marketplace` | NFT skin marketplace |

### Smart Contract Functions

| Function | Description |
|----------|-------------|
| `create_game_seed` | Generate provably fair game seed |
| `submit_score` | Submit score and claim token rewards |
| `register_username` | Register unique username |
| `mint_skin` | Mint BlockSkin NFT |
| `list_skin` | List NFT on marketplace |
| `buy_skin` | Purchase NFT from marketplace |
| `create_battle` | Create multiplayer battle with wager |
| `join_battle` | Join existing battle |
| `end_battle` | Finalize battle and transfer winnings |

### WebSocket Events

| Event | Description |
|-------|-------------|
| `matchmaking:join` | Join matchmaking queue |
| `room:create` | Create private room |
| `room:join` | Join room with code |
| `game:state_update` | Sync game state |
| `game:over` | Notify game over |
| `battle:attack` | Send garbage lines |

---

## 🚀 Future Implementation

### 🎮 Enhanced Gameplay
- **T-Spin Detection** - bonus points for advanced techniques
- **Perfect Clear** - reward for clearing entire board
- **Marathon Mode** - survive as long as possible
- **Sprint Mode** - clear 40 lines as fast as possible
- **Zen Mode** - relaxing endless mode with no game over

### 🏆 Competitive Features
- **Ranked Ladder** - ELO rating system with divisions
- **Tournaments** - scheduled competitions with prize pools
- **Seasonal Leaderboards** - monthly/seasonal rankings
- **Achievements System** - unlock badges and titles
- **Replay System** - watch and share your best games

### 💰 Advanced Economy
- **Staking** - stake TETRI tokens for passive rewards
- **Governance** - vote on game updates and features
- **Skin Rarity Tiers** - common, rare, epic, legendary skins
- **Animated Skins** - skins with particle effects
- **Sound Pack NFTs** - custom sound effect collections

### 🌐 Social Features
- **Friend System** - add friends and challenge them
- **Global Chat** - communicate with other players
- **Guilds/Clans** - form teams and compete together
- **Spectator Mode** - watch live matches
- **Leaderboard Filters** - daily, weekly, monthly, all-time

### 📱 Platform Expansion
- **Mobile App** - native iOS and Android apps
- **Progressive Web App** - installable web app
- **Cross-Platform** - play on any device with synced progress
- **VR Mode** - immersive 3D Tetris experience

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **OneWallet** browser extension
- **Sui Testnet** tokens (for gas fees)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tetrichain.git
cd tetrichain
```

2. **Install client dependencies**
```bash
cd client
npm install
```

3. **Install server dependencies**
```bash
cd ../server
npm install
```

4. **Set up environment variables**

Client (`client/.env`):
```env
VITE_SOCKET_SERVER_URL=http://localhost:3001
```

Server (`server/.env`):
```env
PORT=3001
NODE_ENV=development
```

5. **Run the development servers**

**Client** (in `client/` directory):
```bash
npm run dev
```

**Server** (in `server/` directory):
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:5173
```

### Wallet Setup

1. Install [OneWallet browser extension](https://chrome.google.com/webstore)
2. Create or import a wallet
3. Switch network to **Sui Testnet**
4. Get testnet SUI tokens from [Sui Faucet](https://faucet.testnet.sui.io/)
5. Connect wallet to TetriChain

### Game Controls

| Key | Action |
|-----|--------|
| **← →** | Move piece left/right |
| **↑** | Rotate piece clockwise |
| **↓** | Soft drop (faster fall) |
| **Space** | Hard drop (instant fall) |
| **C** | Hold piece |
| **P** | Pause/Resume |

---

## 📁 Project Structure

```
tetrichain/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── GameBoard.jsx
│   │   │   ├── BattleView.jsx
│   │   │   ├── CustomizationMenu.jsx
│   │   │   ├── MarketplaceView.jsx
│   │   │   └── ...
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useGame.js
│   │   │   ├── useBlockchain.js
│   │   │   ├── useSkinNFT.js
│   │   │   └── useWebSocket.js
│   │   ├── game.js          # Tetris game engine
│   │   ├── random.js        # Deterministic RNG
│   │   ├── config.js        # Contract configuration
│   │   └── skinConfig.js    # Skin definitions
│   ├── css/                 # Stylesheets
│   ├── public/              # Static assets
│   └── tests/               # Unit tests
│
├── server/                  # Node.js multiplayer server
│   └── src/
│       ├── services/        # Business logic
│       │   ├── MatchmakingService.ts
│       │   ├── RoomManager.ts
│       │   └── GameStateSync.ts
│       └── index.ts         # Server entry point
│
├── contract/                # Sui Move smart contracts
│   ├── sources/
│   │   └── game.move        # Main contract
│   └── tests/               # Move tests
│
├── ARCHITECTURE.md          # System architecture docs
├── DEPLOYMENT.md            # Deployment guide
└── README.md                # This file
```

---

## 🎮 How to Play

### Solo Mode

1. **Connect Wallet** - click "Connect Wallet" and approve
2. **Start Game** - click "Start Game" to generate blockchain seed
3. **Play Tetris** - use arrow keys to move and rotate pieces
4. **Submit Score** - after game over, submit your score to earn tokens
5. **Unlock Skins** - achieve milestones to unlock new skins

### Multiplayer Mode

1. **Join Matchmaking** - click "Find Match" for automatic pairing
2. **Or Create Room** - create private room and share code with friends
3. **Battle** - compete to outlast your opponent
4. **Send Attacks** - clear multiple lines to send garbage to opponent
5. **Win Rewards** - winner takes the wager pot

### NFT Marketplace

1. **Unlock Skins** - play games to unlock skins
2. **Claim NFT** - mint your unlocked skin as an NFT
3. **List for Sale** - set price and duration
4. **Browse Listings** - buy skins from other players
5. **Trade** - build your collection

---

## 🧪 Testing

Run unit tests:
```bash
cd client
npm test
```

Run property-based tests:
```bash
npm run test:watch
```

---

## 📄 Smart Contract

**Package ID**: `0x9fb6a73cd68dfb1821ab456982e6c9256546a8ecd29cd14bd7b803a2e3c9eb37`

**Network**: Sui Testnet

**Explorer**: [View on SuiScan](https://testnet.suivision.xyz/package/0x9fb6a73cd68dfb1821ab456982e6c9256546a8ecd29cd14bd7b803a2e3c9eb37)

---

## 👨‍💻 Author

Built with ❤️ by **[Your Name]**

Developed using **Kiro IDE** - AI-powered development environment

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- **Sui Foundation** - for the amazing blockchain platform
- **Tetris** - for the timeless game concept
- **Kiro IDE** - for AI-powered development tools
- **Open Source Community** - for the incredible tools and libraries

---

## ⭐ Star this repo if you like it! ⭐

**Play TetriChain today and start earning while playing!** 🎮⛓️
