# TetriChain React Conversion Plan

## Overview
This document provides a complete plan to convert TetriChain from vanilla JavaScript to React with @mysten/dapp-kit integration. This conversion is necessary because OneChain wallet requires dapp-kit for proper transaction handling.

## Why This Conversion is Needed
- **OneChain Wallet Compatibility**: OneChain wallet rejects transactions from vanilla JS but works perfectly with dapp-kit
- **Proven Solution**: Test at `test-dappkit.html` successfully creates game seeds with OneChain
- **Official Approach**: @mysten/dapp-kit is the official, recommended way to integrate Sui wallets

## Prerequisites
✅ Already installed:
- @mysten/dapp-kit@^0.19.8
- @mysten/sui@1.45.0
- @tanstack/react-query@^5.0.0
- react@^18.2.0
- react-dom@^18.2.0
- @vitejs/plugin-react@^4.2.0

## File Structure

### New Files to Create
```
src/
├── components/
│   ├── TetrisGame.jsx          # Main game component
│   ├── GameCanvas.jsx           # Canvas rendering component
│   ├── GameControls.jsx         # Start/Pause buttons
│   ├── GameInfo.jsx             # Score, lines, level display
│   ├── GameOver.jsx             # Game over screen
│   ├── WalletSection.jsx        # Wallet connection UI
│   ├── Leaderboard.jsx          # Leaderboard display
│   └── TokenBalance.jsx         # Token balance display
├── hooks/
│   ├── useGameEngine.js         # Game logic hook
│   ├── useBlockchain.js         # Blockchain operations hook
│   └── useKeyboard.js           # Keyboard input hook
├── utils/
│   ├── gameLogic.js             # Pure game logic (from game.js)
│   ├── pieceGenerator.js        # Piece generation (from random.js)
│   └── constants.js             # Game constants
├── App.jsx                      # Main app component
└── main.jsx                     # Entry point with providers
```

### Files to Keep (No Changes)
- `src/config.js` - Contract configuration
- `tetrichain/contract/*` - Smart contract files
- `css/style.css` - Base styles (will be imported)

### Files to Archive (Keep for Reference)
- `src/main.js` → `src/main.js.backup`
- `src/blockchain.js` → `src/blockchain.js.backup`
- `src/ui.js` → `src/ui.js.backup`
- `src/game.js` → `src/game.js.backup`

---

## Step-by-Step Conversion Plan

### Phase 1: Setup React Infrastructure

#### Step 1.1: Update index.html
**File**: `index.html`

Replace the body content:
```html
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
```

#### Step 1.2: Create Main Entry Point
**File**: `src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import '@mysten/dapp-kit/dist/index.css';
import '../css/style.css';

const queryClient = new QueryClient();
const networks = {
    testnet: { url: getFullnodeUrl('testnet') },
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networks} defaultNetwork="testnet">
                <WalletProvider>
                    <App />
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
```

---

### Phase 2: Extract Pure Game Logic

#### Step 2.1: Create Game Constants
**File**: `src/utils/constants.js`

Extract from `game.js`:
```javascript
export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 30;

export const PIECES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]]
};

export const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
};

export const POINTS = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800
};
```

#### Step 2.2: Create Pure Game Logic
**File**: `src/utils/gameLogic.js`

Extract pure functions from `game.js`:
- `createEmptyGrid()`
- `isValidMove(grid, piece, x, y)`
- `rotatePiece(piece)`
- `lockPiece(grid, piece, x, y, color)`
- `clearLines(grid)`
- `calculateScore(linesCleared, level)`

#### Step 2.3: Create Piece Generator
**File**: `src/utils/pieceGenerator.js`

Copy from `src/random.js` (already exists and works)

---

### Phase 3: Create React Hooks

#### Step 3.1: Create Game Engine Hook
**File**: `src/hooks/useGameEngine.js`

This is the core game logic hook. It should:
- Manage game state (grid, current piece, score, level, etc.)
- Handle game loop with useEffect
- Provide game control functions (start, pause, move, rotate)
- Use PieceGenerator for deterministic pieces

```javascript
import { useState, useEffect, useCallback, useRef } from 'react';
import { PieceGenerator } from '../utils/pieceGenerator';
import * as GameLogic from '../utils/gameLogic';
import { PIECES, COLORS } from '../utils/constants';

export function useGameEngine(seed) {
    const [gameState, setGameState] = useState({
        grid: GameLogic.createEmptyGrid(),
        currentPiece: null,
        currentX: 0,
        currentY: 0,
        score: 0,
        lines: 0,
        level: 1,
        isPlaying: false,
        isGameOver: false
    });
    
    // Game loop, piece movement, collision detection, etc.
    // ... (convert logic from game.js)
    
    return {
        gameState,
        startGame,
        pauseGame,
        moveLeft,
        moveRight,
        moveDown,
        rotate,
        drop
    };
}
```

#### Step 3.2: Create Blockchain Hook
**File**: `src/hooks/useBlockchain.js`

This replaces `blockchain.js` using dapp-kit hooks:

```javascript
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACT_CONFIG, TX_CONFIG } from '../config';

export function useBlockchain() {
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const client = useSuiClient();
    
    const createGameSeed = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!account) {
                reject(new Error('Wallet not connected'));
                return;
            }
            
            const tx = new Transaction();
            tx.setSender(account.address);
            tx.moveCall({
                target: `${CONTRACT_CONFIG.packageId}::${CONTRACT_CONFIG.moduleName}::create_game_seed`,
                arguments: [
                    tx.object(CONTRACT_CONFIG.randomId),
                    tx.object(CONTRACT_CONFIG.clockId),
                ],
            });
            tx.setGasBudget(TX_CONFIG.createSeedGasBudget);
            
            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: async (result) => {
                        // Extract seed from result
                        const createdObjects = result.objectChanges?.filter(
                            change => change.type === 'created' && 
                            change.objectType.includes('::game::GameSeed')
                        );
                        
                        if (createdObjects && createdObjects.length > 0) {
                            const gameSeedObjectId = createdObjects[0].objectId;
                            const gameSeedObject = await client.getObject({
                                id: gameSeedObjectId,
                                options: { showContent: true },
                            });
                            
                            const seedBytes = gameSeedObject.data?.content?.fields?.seed;
                            const seed = new Uint8Array(seedBytes);
                            
                            resolve({
                                success: true,
                                seed,
                                gameSeedObjectId,
                                txDigest: result.digest
                            });
                        } else {
                            reject(new Error('GameSeed object not found'));
                        }
                    },
                    onError: (error) => {
                        reject(error);
                    }
                }
            );
        });
    }, [account, signAndExecuteTransaction, client]);
    
    const submitScore = useCallback((gameSeedObjectId, score) => {
        // Similar pattern for score submission
    }, [account, signAndExecuteTransaction]);
    
    const getLeaderboard = useCallback(async () => {
        // Query leaderboard
    }, [client]);
    
    const getPlayerBalance = useCallback(async () => {
        // Query balance
    }, [client, account]);
    
    return {
        account,
        createGameSeed,
        submitScore,
        getLeaderboard,
        getPlayerBalance
    };
}
```

#### Step 3.3: Create Keyboard Hook
**File**: `src/hooks/useKeyboard.js`

```javascript
import { useEffect } from 'react';

export function useKeyboard(handlers, isActive) {
    useEffect(() => {
        if (!isActive) return;
        
        const handleKeyDown = (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    handlers.onLeft?.();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handlers.onRight?.();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    handlers.onDown?.();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    handlers.onRotate?.();
                    break;
                case ' ':
                    e.preventDefault();
                    handlers.onDrop?.();
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers, isActive]);
}
```

---

### Phase 4: Create React Components

#### Step 4.1: Create GameCanvas Component
**File**: `src/components/GameCanvas.jsx`

```jsx
import React, { useEffect, useRef } from 'react';
import { COLS, ROWS, BLOCK_SIZE, COLORS } from '../utils/constants';

export function GameCanvas({ grid, currentPiece, currentX, currentY, currentColor }) {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (grid[y][x]) {
                    ctx.fillStyle = grid[y][x];
                    ctx.fillRect(
                        x * BLOCK_SIZE,
                        y * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }
        
        // Draw current piece
        if (currentPiece) {
            ctx.fillStyle = currentColor;
            for (let y = 0; y < currentPiece.length; y++) {
                for (let x = 0; x < currentPiece[y].length; x++) {
                    if (currentPiece[y][x]) {
                        ctx.fillRect(
                            (currentX + x) * BLOCK_SIZE,
                            (currentY + y) * BLOCK_SIZE,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                    }
                }
            }
        }
        
        // Draw grid lines
        ctx.strokeStyle = '#333';
        for (let i = 0; i <= COLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * BLOCK_SIZE, 0);
            ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            ctx.stroke();
        }
        for (let i = 0; i <= ROWS; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * BLOCK_SIZE);
            ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
            ctx.stroke();
        }
    }, [grid, currentPiece, currentX, currentY, currentColor]);
    
    return (
        <canvas
            ref={canvasRef}
            width={COLS * BLOCK_SIZE}
            height={ROWS * BLOCK_SIZE}
            style={{ border: '2px solid #fff' }}
        />
    );
}
```

#### Step 4.2: Create GameInfo Component
**File**: `src/components/GameInfo.jsx`

```jsx
import React from 'react';

export function GameInfo({ score, lines, level }) {
    return (
        <div className="game-info">
            <div className="info-item">
                <span className="label">Score:</span>
                <span className="value">{score}</span>
            </div>
            <div className="info-item">
                <span className="label">Lines:</span>
                <span className="value">{lines}</span>
            </div>
            <div className="info-item">
                <span className="label">Level:</span>
                <span className="value">{level}</span>
            </div>
        </div>
    );
}
```

#### Step 4.3: Create GameControls Component
**File**: `src/components/GameControls.jsx`

```jsx
import React from 'react';

export function GameControls({ isPlaying, onStart, onPause }) {
    return (
        <div className="game-controls">
            <button 
                className="btn btn-primary" 
                onClick={onStart}
                disabled={isPlaying}
            >
                Start Game
            </button>
            <button 
                className="btn btn-secondary" 
                onClick={onPause}
                disabled={!isPlaying}
            >
                Pause
            </button>
        </div>
    );
}
```

#### Step 4.4: Create GameOver Component
**File**: `src/components/GameOver.jsx`

```jsx
import React, { useState } from 'react';

export function GameOver({ score, gameSeedObjectId, onSubmitScore, onPlayAgain }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const result = await onSubmitScore(gameSeedObjectId, score);
            setSubmitResult(result);
        } catch (error) {
            setSubmitResult({ success: false, error: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="game-over">
            <h2>Game Over!</h2>
            <p>Final Score: <span id="finalScore">{score}</span></p>
            <div className="game-over-actions">
                <button 
                    className="btn btn-primary" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !gameSeedObjectId}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit to Blockchain'}
                </button>
                <button 
                    className="btn btn-secondary" 
                    onClick={onPlayAgain}
                >
                    Play Again
                </button>
            </div>
            {submitResult && (
                <div className={`submit-result ${submitResult.success ? 'success' : 'error'}`}>
                    {submitResult.success 
                        ? `Success! Earned ${submitResult.tokensEarned} TETRI tokens!`
                        : `Error: ${submitResult.error}`
                    }
                </div>
            )}
        </div>
    );
}
```

#### Step 4.5: Create WalletSection Component
**File**: `src/components/WalletSection.jsx`

```jsx
import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';

export function WalletSection({ account }) {
    return (
        <div className="wallet-status">
            <h3>Wallet</h3>
            <ConnectButton />
            {account && (
                <p className="wallet-address">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </p>
            )}
        </div>
    );
}
```

#### Step 4.6: Create Leaderboard Component
**File**: `src/components/Leaderboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';

export function Leaderboard({ getLeaderboard, currentAddress }) {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const refresh = async () => {
        setLoading(true);
        try {
            const result = await getLeaderboard();
            if (result.success) {
                setScores(result.scores);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        refresh();
    }, []);
    
    return (
        <div className="leaderboard">
            <h3>Leaderboard</h3>
            <button 
                className="btn btn-secondary" 
                onClick={refresh}
                disabled={loading}
            >
                {loading ? 'Loading...' : 'Refresh'}
            </button>
            <div className="leaderboard-list">
                {scores.length === 0 ? (
                    <p className="empty-state">No scores yet. Be the first!</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scores.map((entry, index) => (
                                <tr 
                                    key={index}
                                    className={entry.player === currentAddress ? 'highlight' : ''}
                                >
                                    <td>{index + 1}</td>
                                    <td>{entry.player.slice(0, 6)}...{entry.player.slice(-4)}</td>
                                    <td>{entry.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
```

#### Step 4.7: Create TokenBalance Component
**File**: `src/components/TokenBalance.jsx`

```jsx
import React, { useState, useEffect } from 'react';

export function TokenBalance({ getPlayerBalance, account }) {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    
    const refresh = async () => {
        if (!account) return;
        
        setLoading(true);
        try {
            const result = await getPlayerBalance();
            if (result.success) {
                setBalance(result.balance);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        refresh();
    }, [account]);
    
    return (
        <div className="token-balance">
            <h3>Your Tokens</h3>
            <p className="balance-amount">{balance.toFixed(2)} TETRI</p>
            <button 
                className="btn btn-secondary" 
                onClick={refresh}
                disabled={loading || !account}
            >
                {loading ? 'Loading...' : 'Refresh'}
            </button>
        </div>
    );
}
```

#### Step 4.8: Create Main TetrisGame Component
**File**: `src/components/TetrisGame.jsx`

```jsx
import React, { useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { useBlockchain } from '../hooks/useBlockchain';
import { useKeyboard } from '../hooks/useKeyboard';
import { GameCanvas } from './GameCanvas';
import { GameInfo } from './GameInfo';
import { GameControls } from './GameControls';
import { GameOver } from './GameOver';

export function TetrisGame() {
    const [gameSeed, setGameSeed] = useState(null);
    const [gameSeedObjectId, setGameSeedObjectId] = useState(null);
    const [isCreatingSeed, setIsCreatingSeed] = useState(false);
    
    const { account, createGameSeed, submitScore } = useBlockchain();
    const gameEngine = useGameEngine(gameSeed);
    const { gameState, startGame, pauseGame, moveLeft, moveRight, moveDown, rotate, drop } = gameEngine;
    
    useKeyboard({
        onLeft: moveLeft,
        onRight: moveRight,
        onDown: moveDown,
        onRotate: rotate,
        onDrop: drop
    }, gameState.isPlaying);
    
    const handleStartGame = async () => {
        if (account) {
            // Create blockchain seed
            setIsCreatingSeed(true);
            try {
                const result = await createGameSeed();
                if (result.success) {
                    setGameSeed(result.seed);
                    setGameSeedObjectId(result.gameSeedObjectId);
                    startGame(result.seed);
                }
            } catch (error) {
                console.error('Error creating seed:', error);
                // Fall back to random seed
                const randomSeed = new Uint8Array(32);
                crypto.getRandomValues(randomSeed);
                setGameSeed(randomSeed);
                setGameSeedObjectId(null);
                startGame(randomSeed);
            } finally {
                setIsCreatingSeed(false);
            }
        } else {
            // Play without blockchain
            const randomSeed = new Uint8Array(32);
            crypto.getRandomValues(randomSeed);
            setGameSeed(randomSeed);
            startGame(randomSeed);
        }
    };
    
    const handlePlayAgain = () => {
        setGameSeed(null);
        setGameSeedObjectId(null);
    };
    
    return (
        <div className="game-section">
            <GameInfo 
                score={gameState.score}
                lines={gameState.lines}
                level={gameState.level}
            />
            
            <GameCanvas
                grid={gameState.grid}
                currentPiece={gameState.currentPiece}
                currentX={gameState.currentX}
                currentY={gameState.currentY}
                currentColor={gameState.currentColor}
            />
            
            {!gameState.isGameOver ? (
                <GameControls
                    isPlaying={gameState.isPlaying}
                    onStart={handleStartGame}
                    onPause={pauseGame}
                />
            ) : (
                <GameOver
                    score={gameState.score}
                    gameSeedObjectId={gameSeedObjectId}
                    onSubmitScore={submitScore}
                    onPlayAgain={handlePlayAgain}
                />
            )}
            
            {isCreatingSeed && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Creating blockchain seed...</p>
                </div>
            )}
        </div>
    );
}
```

---

### Phase 5: Create Main App Component

#### Step 5.1: Create App Component
**File**: `src/App.jsx`

```jsx
import React from 'react';
import { useBlockchain } from './hooks/useBlockchain';
import { TetrisGame } from './components/TetrisGame';
import { WalletSection } from './components/WalletSection';
import { Leaderboard } from './components/Leaderboard';
import { TokenBalance } from './components/TokenBalance';

function App() {
    const { account, getLeaderboard, getPlayerBalance } = useBlockchain();
    
    return (
        <div className="container">
            <header>
                <h1>TetriChain</h1>
                <p className="subtitle">Play Tetris, Earn Tokens on Sui</p>
            </header>
            
            <div className="main-content">
                <TetrisGame />
                
                <div className="blockchain-section">
                    <WalletSection account={account} />
                    <TokenBalance 
                        getPlayerBalance={getPlayerBalance}
                        account={account}
                    />
                    <Leaderboard 
                        getLeaderboard={getLeaderboard}
                        currentAddress={account?.address}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
```

---

### Phase 6: Testing and Validation

#### Step 6.1: Test Checklist

After conversion, test each feature:

- [ ] Game starts and pieces fall
- [ ] Keyboard controls work (arrows, space)
- [ ] Pieces rotate correctly
- [ ] Lines clear when complete
- [ ] Score increases correctly
- [ ] Game over triggers when pieces reach top
- [ ] Wallet connects with OneChain
- [ ] Game seed creates on blockchain
- [ ] Score submits to blockchain
- [ ] Tokens are earned
- [ ] Leaderboard displays
- [ ] Token balance displays
- [ ] All UI elements render correctly
- [ ] No console errors

#### Step 6.2: Run Tests

```bash
npm test
```

Update tests if needed to work with React components.

---

## Implementation Order

1. **Phase 1**: Setup React infrastructure (Steps 1.1-1.2)
2. **Phase 2**: Extract pure logic (Steps 2.1-2.3)
3. **Phase 3**: Create hooks (Steps 3.1-3.3)
4. **Phase 4**: Create components (Steps 4.1-4.8)
5. **Phase 5**: Wire everything together (Step 5.1)
6. **Phase 6**: Test thoroughly (Steps 6.1-6.2)

## Key Points to Remember

1. **Game Logic**: Keep game logic pure and separate from React
2. **Dapp-Kit**: Use hooks from @mysten/dapp-kit, don't manually call wallet
3. **Transaction Format**: Use `Transaction` from @mysten/sui/transactions
4. **State Management**: Use React hooks, no need for external state management
5. **Canvas Rendering**: Use useEffect to redraw canvas when state changes
6. **Keyboard Input**: Use useEffect with event listeners, clean up properly
7. **Error Handling**: Wrap blockchain calls in try-catch, show user-friendly errors
8. **Loading States**: Show loading indicators during blockchain operations

## Common Pitfalls to Avoid

1. ❌ Don't use TransactionBlock - use Transaction
2. ❌ Don't manually call window.onechain - use dapp-kit hooks
3. ❌ Don't forget to clean up event listeners in useEffect
4. ❌ Don't mutate state directly - always use setState
5. ❌ Don't forget dependencies in useEffect/useCallback
6. ❌ Don't block the game loop with async operations
7. ❌ Don't forget to handle the case when wallet is not connected

## Success Criteria

✅ Game plays identically to vanilla JS version
✅ All blockchain features work with OneChain wallet
✅ No console errors
✅ All tests pass
✅ Code is clean and maintainable
✅ User experience is smooth

## Estimated Time

- Phase 1: 15 minutes
- Phase 2: 30 minutes
- Phase 3: 1 hour
- Phase 4: 2 hours
- Phase 5: 30 minutes
- Phase 6: 1 hour

**Total: ~5-6 hours**

## Next Steps

1. Start with Phase 1 to set up the React infrastructure
2. Work through each phase sequentially
3. Test frequently as you build
4. Refer to `test-dappkit.html` for working blockchain integration example
5. Keep the vanilla JS files as backup until React version is fully working

Good luck! 🚀
