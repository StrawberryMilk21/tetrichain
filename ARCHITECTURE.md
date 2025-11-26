# TetriChain React Architecture

## Component Hierarchy

```
App.jsx (Main Orchestrator)
├── Header
│   ├── Title
│   └── ConnectButton (from @mysten/dapp-kit)
│
├── Game Section
│   ├── Menu Mode
│   │   └── Start Button
│   ├── Playing Mode
│   │   ├── GameInfo (score, level, lines, pause button)
│   │   └── GameBoard (canvas rendering)
│   └── Game Over Mode
│       ├── Final Score
│       ├── Submit Score Button
│       └── Play Again Button
│
├── Blockchain Section
│   ├── WalletStatus (address, balance, refresh)
│   └── Leaderboard (top scores, refresh)
│
├── LoadingOverlay (transaction loading)
└── Toast (notifications)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         App.jsx                              │
│  - Manages game mode (menu/playing/gameOver)                │
│  - Coordinates between game and blockchain                   │
│  - Handles user actions                                      │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│   useGame Hook       │          │  useBlockchain Hook  │
│  - Game state        │          │  - Wallet state      │
│  - Game actions      │          │  - Blockchain ops    │
│  - Keyboard controls │          │  - Leaderboard       │
└──────────────────────┘          └──────────────────────┘
         │                                    │
         ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│   TetrisGame Class   │          │   @mysten/dapp-kit   │
│  - Game logic        │          │  - Wallet provider   │
│  - Grid management   │          │  - Transaction hooks │
│  - Piece generation  │          │  - Sui client        │
└──────────────────────┘          └──────────────────────┘
         │                                    │
         ▼                                    ▼
┌──────────────────────┐          ┌──────────────────────┐
│   PieceGenerator     │          │   Sui Blockchain     │
│  - Seeded RNG        │          │  - Smart contract    │
│  - Deterministic     │          │  - Leaderboard       │
└──────────────────────┘          └──────────────────────┘
```

## State Management

### Game State (useGame)
```javascript
{
  grid: Array<Array<number>>,      // 10x20 grid
  currentPiece: Piece,              // Active falling piece
  nextPiece: Piece,                 // Preview piece
  score: number,                    // Current score
  linesCleared: number,             // Total lines cleared
  level: number,                    // Current level
  isGameOver: boolean,              // Game over flag
  isPaused: boolean                 // Pause flag
}
```

### Blockchain State (useBlockchain)
```javascript
{
  account: Account | null,          // Connected wallet
  isCreatingGameSeed: boolean,      // Loading state
  isSubmittingScore: boolean,       // Loading state
  isLoadingLeaderboard: boolean,    // Loading state
  isLoadingBalance: boolean,        // Loading state
  leaderboard: Array<Score>,        // Top scores
  playerBalance: number             // Token balance
}
```

## Hook Dependencies

```
useGame
├── useState (game state)
├── useRef (game instance, animation frame)
├── useEffect (game loop, keyboard controls)
└── useCallback (game actions)

useBlockchain
├── useCurrentAccount (from dapp-kit)
├── useSignAndExecuteTransaction (from dapp-kit)
├── useSuiClient (from dapp-kit)
├── useState (loading states, data)
├── useEffect (auto-fetch on mount)
└── useCallback (blockchain operations)
```

## Component Props Flow

```
App
├── GameBoard
│   ├── grid: Array<Array<number>>
│   ├── currentPiece: Piece
│   └── isPaused: boolean
│
├── GameInfo
│   ├── score: number
│   ├── level: number
│   ├── lines: number
│   ├── nextPiece: Piece
│   ├── isPaused: boolean
│   └── onPause: () => void
│
├── Leaderboard
│   ├── scores: Array<Score>
│   ├── currentPlayerAddress: string
│   ├── isLoading: boolean
│   └── onRefresh: () => void
│
├── WalletStatus
│   ├── account: Account | null
│   ├── balance: number
│   ├── isLoadingBalance: boolean
│   └── onRefreshBalance: () => void
│
├── LoadingOverlay
│   └── message: string
│
└── Toast
    ├── type: 'success' | 'error'
    ├── message: string
    └── onClose: () => void
```

## Event Flow

### Starting a Game
```
User clicks "Start Game"
    ↓
App.handleStartGame()
    ↓
If wallet connected:
    blockchain.createGameSeed()
        ↓
    Transaction signed
        ↓
    Game seed created on-chain
        ↓
    Seed extracted from blockchain
        ↓
game.startGame(seed)
    ↓
Game mode → 'playing'
```

### Playing the Game
```
User presses arrow key
    ↓
useGame keyboard handler
    ↓
game.moveLeft/Right/Down/Rotate()
    ↓
TetrisGame updates internal state
    ↓
updateGameState() called
    ↓
React state updated
    ↓
Components re-render
    ↓
GameBoard draws new state
```

### Submitting Score
```
Game over detected
    ↓
Game mode → 'gameOver'
    ↓
User clicks "Submit to Blockchain"
    ↓
App.handleSubmitScore()
    ↓
blockchain.submitScore(gameSeedId, score)
    ↓
Transaction signed
    ↓
Score recorded on-chain
    ↓
Tokens minted to player
    ↓
Leaderboard updated
    ↓
Balance refreshed
    ↓
Success toast shown
```

## Provider Hierarchy

```
ReactDOM.createRoot
└── React.StrictMode
    └── QueryClientProvider (React Query)
        └── SuiClientProvider (@mysten/dapp-kit)
            └── WalletProvider (@mysten/dapp-kit)
                └── App
                    └── [All Components]
```

## Key Design Decisions

### 1. Preserve Game Engine
- **Decision**: Keep TetrisGame class unchanged
- **Reason**: Proven, tested game logic
- **Benefit**: No risk of introducing bugs

### 2. Wrap with Hooks
- **Decision**: Create useGame hook to wrap TetrisGame
- **Reason**: Bridge between class-based and React patterns
- **Benefit**: React state management without rewriting logic

### 3. Use dapp-kit
- **Decision**: Use @mysten/dapp-kit instead of custom wallet code
- **Reason**: Official, maintained, supports OneChain
- **Benefit**: Reliable wallet integration

### 4. Component Composition
- **Decision**: Small, focused components
- **Reason**: Easier to test and maintain
- **Benefit**: Clear separation of concerns

### 5. Canvas Rendering
- **Decision**: Keep canvas-based rendering
- **Reason**: Performance for 60fps game loop
- **Benefit**: Smooth gameplay

## Performance Considerations

### Game Loop
- Uses `requestAnimationFrame` for smooth 60fps
- Cleanup handled by useEffect return
- State updates batched by React

### Canvas Rendering
- Direct canvas manipulation (not React-rendered)
- Only re-renders when state changes
- Efficient for high-frequency updates

### Blockchain Operations
- Async operations with loading states
- Error handling with user feedback
- Auto-refresh for leaderboard and balance

### Code Splitting
- Could add lazy loading for components
- Current bundle size acceptable (177 KB gzipped)
- Room for optimization if needed

## Testing Strategy

### Unit Tests
- Test game logic (TetrisGame class)
- Test piece generation (PieceGenerator)
- Test utility functions

### Component Tests
- Test component rendering
- Test user interactions
- Test prop handling

### Integration Tests
- Test game flow (start → play → game over)
- Test blockchain flow (connect → create seed → submit)
- Test error handling

### E2E Tests
- Test complete user journey
- Test wallet integration
- Test blockchain transactions

## Future Enhancements

### Potential Improvements
1. **Next Piece Preview** - Show next piece in UI
2. **Ghost Piece** - Show where piece will land
3. **Hold Piece** - Allow holding a piece for later
4. **Animations** - Add piece lock and line clear animations
5. **Sound Effects** - Add audio feedback
6. **Mobile Controls** - Touch controls for mobile
7. **Multiplayer** - Real-time multiplayer mode
8. **Tournaments** - Scheduled competitive events
9. **NFT Rewards** - Special NFTs for achievements
10. **Social Features** - Share scores, challenge friends

### Technical Improvements
1. **Code Splitting** - Lazy load components
2. **Service Worker** - Offline gameplay
3. **WebGL Rendering** - Even better performance
4. **State Persistence** - Save game state
5. **Analytics** - Track user behavior
6. **A/B Testing** - Test UI variations
7. **Internationalization** - Multi-language support
8. **Accessibility** - Screen reader support
9. **Progressive Web App** - Installable app
10. **TypeScript** - Full type safety

---

This architecture provides a solid foundation for a modern, maintainable, and scalable Web3 game.
