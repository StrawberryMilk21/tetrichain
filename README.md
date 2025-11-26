# TetriChain

A Web3-enabled Tetris game built on the Sui blockchain with React and @mysten/dapp-kit. Play classic Tetris, submit your scores on-chain, and earn tokens based on your performance!

## 🎉 React Conversion Complete!

TetriChain has been successfully converted from vanilla JavaScript to React with proper OneChain wallet integration via @mysten/dapp-kit. See [REACT_CONVERSION_COMPLETE.md](./REACT_CONVERSION_COMPLETE.md) for details.

## Project Structure

```
tetrichain/
├── contract/              # Sui Move smart contract
│   ├── sources/          # Move source files
│   ├── tests/            # Move test files
│   └── Move.toml         # Move package configuration
│
└── client/               # React web game client
    ├── src/
    │   ├── components/   # React components
    │   │   ├── GameBoard.jsx
    │   │   ├── GameInfo.jsx
    │   │   ├── Leaderboard.jsx
    │   │   ├── WalletStatus.jsx
    │   │   ├── LoadingOverlay.jsx
    │   │   └── Toast.jsx
    │   ├── hooks/        # Custom React hooks
    │   │   ├── useGame.js
    │   │   └── useBlockchain.js
    │   ├── App.jsx       # Main app component
    │   ├── main.jsx      # React entry point
    │   ├── game.js       # Tetris game engine
    │   ├── blockchain.js # Sui blockchain interface (legacy)
    │   ├── ui.js         # UI management (legacy)
    │   ├── random.js     # Deterministic piece generation
    │   └── config.js     # Contract configuration
    ├── css/              # Stylesheets
    │   └── style.css     # Main stylesheet
    ├── tests/            # Tests
    ├── backup/           # Vanilla JS backup
    ├── index.html        # Main HTML file
    ├── package.json      # NPM dependencies
    └── vite.config.js    # Vite configuration
```

## Features

- 🎮 Classic Tetris gameplay with smooth controls
- ⚛️ Built with React for modern, maintainable code
- 🔗 Sui blockchain integration via @mysten/dapp-kit
- 🏆 On-chain leaderboard with real-time updates
- 🪙 Play-to-earn TETRI token rewards
- ✅ Provably fair game mechanics with blockchain seeds
- 📱 Responsive design for all devices
- 🎨 Beautiful gradient UI with smooth animations

## Prerequisites

- Node.js (v18 or higher)
- Sui CLI (for contract deployment)
- OneChain or OneWallet browser extension

## Quick Start

### 1. Install Dependencies

```bash
cd tetrichain/client
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The game will open at http://localhost:3002 (or next available port)

### 3. Connect Wallet

- Install OneChain or OneWallet browser extension
- Click "Connect Wallet" in the game
- Approve the connection request

### 4. Play!

- Click "Start Game" to begin
- Use arrow keys to move and rotate pieces
- Press Space for hard drop
- Press P to pause

## Building for Production

```bash
npm run build
npm run preview
```

## Smart Contract Deployment

The smart contract is already deployed on Sui testnet. If you need to deploy your own:

```bash
cd tetrichain/contract
sui move build
sui client publish --gas-budget 100000000
```

Then update `client/src/config.js` with your contract addresses.

## Technology Stack

### Frontend
- **React 18** - UI framework
- **@mysten/dapp-kit** - Sui wallet integration
- **@mysten/sui** - Sui blockchain SDK
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework

### Smart Contract
- **Sui Move** - Smart contract language
- **Sui Testnet** - Blockchain network

## Game Controls

- **← →** - Move piece left/right
- **↑** - Rotate piece
- **↓** - Soft drop (faster fall)
- **Space** - Hard drop (instant fall)
- **P** - Pause/Resume

## How It Works

1. **Connect Wallet** - Connect your OneChain/OneWallet to the game
2. **Create Game Seed** - When you start a game, a provably fair seed is created on-chain
3. **Play Tetris** - Enjoy classic Tetris gameplay with deterministic piece generation
4. **Submit Score** - After game over, submit your score to the blockchain
5. **Earn Tokens** - Receive TETRI tokens based on your score (score / 100)
6. **Compete** - See your rank on the global leaderboard

## Development Status

✅ Smart contract deployed and tested
✅ React conversion complete
✅ OneChain wallet integration working
✅ Game mechanics fully functional
✅ Leaderboard and token rewards working
🔄 Manual testing in progress

## License

MIT
