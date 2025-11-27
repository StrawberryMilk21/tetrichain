# Design Document

## Overview

This design completes the multiplayer Tetris battle functionality by fixing gameplay mechanics, implementing real-time opponent visualization, adding garbage line mechanics, and creating a proper game completion flow with token transfers.

## Architecture

The system uses a client-server architecture with WebSocket communication:

**Client Side:**
- React components for battle UI
- `useMultiplayerBattle` hook managing local game and opponent state
- `useGame` hook for Tetris game logic (reused from solo mode)
- WebSocket client for real-time communication

**Server Side:**
- Socket.IO server for WebSocket connections
- RoomManager for battle room state
- Game state relay between players
- No server-side game logic (client authoritative)

## Components and Interfaces

### Client Components

**useMultiplayerBattle Hook**
```javascript
{
  localGame: GameInstance,
  localGameState: GameState,
  opponentGameState: GameState,
  isGameOver: boolean,
  winner: 'local' | 'opponent' | null
}
```

**BattleView Component**
```javascript
<BattleView
  localPlayer={{ username, address }}
  localGameState={GameState}
  opponentPlayer={{ username, address }}
  opponentGameState={GameState}
  wager={number}
  onForfeit={() => void}
/>
```

**GameOverModal Component**
```javascript
<GameOverModal
  isOpen={boolean}
  winner={Player}
  loser={Player}
  wager={number}
  onPlayAgain={() => void}
  onBackToMenu={() => void}
/>
```

### WebSocket Events

**Client → Server:**
- `game:state_update` - Send game state to opponent
- `game:over` - Notify server of game completion
- `game:garbage` - Send garbage lines to opponent

**Server → Client:**
- `game:opponent_state` - Receive opponent's game state
- `game:opponent_game_over` - Opponent lost
- `game:receive_garbage` - Receive garbage lines from opponent

## Data Models

**GameState**
```typescript
interface GameState {
  grid: Cell[][];
  currentPiece: Piece | null;
  ghostPiece: Piece | null;
  nextQueue: PieceType[];
  holdPiece: Piece | null;
  score: number;
  linesCleared: number;
  level: number;
  piecesPlaced: number;
  isGameOver: boolean;
  isPaused: boolean;
}
```

**BattleResult**
```typescript
interface BattleResult {
  winner: Player;
  loser: Player;
  winnerScore: number;
  loserScore: number;
  wager: number;
  duration: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Game loop continuity
*For any* multiplayer battle, the game loop should run continuously without blocking, allowing pieces to fall at consistent intervals regardless of opponent state updates.
**Validates: Requirements 1.1, 1.5**

### Property 2: Input responsiveness  
*For any* player input (move, rotate, drop, hold), the game should respond within 50ms and the action should complete successfully.
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: State synchronization
*For any* game state change on the local player's board, the opponent should receive the updated state within 200ms.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 4: Deterministic piece generation
*For any* two players in the same battle room using the same seed, the nth piece in their sequence should be identical.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: Garbage line calculation
*For any* line clear event, the number of garbage lines sent should equal: 0 for 1 line, 1 for 2 lines, 2 for 3 lines, 4 for 4 lines.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Garbage line application
*For any* garbage lines received, they should be added to the bottom of the grid and existing blocks should shift upward by the same number of lines.
**Validates: Requirements 4.4, 4.5**

### Property 7: Game over detection
*For any* game state where blocks reach the top of the grid (row 0 or 1), the game should immediately transition to game over state.
**Validates: Requirements 5.1**

### Property 8: Winner determination
*For any* battle where one player reaches game over state, the other player should be declared the winner.
**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 9: Token transfer initiation
*For any* completed battle with a winner, a blockchain transaction should be initiated to transfer the wager amount from loser to winner.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 10: Clean state reset
*For any* player returning to menu after a battle, all game state, WebSocket listeners, and intervals should be properly cleaned up.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

## Error Handling

**Network Errors:**
- Implement exponential backoff for reconnection attempts
- Show connection status indicator to user
- Buffer state updates during brief disconnections

**Game State Errors:**
- Validate received opponent state before rendering
- Use default/fallback values for missing data
- Log errors without crashing the game

**Blockchain Errors:**
- Retry failed transactions up to 3 times
- Show clear error messages to users
- Allow manual retry of token transfers

## Testing Strategy

**Unit Tests:**
- Test garbage line calculation logic
- Test game over detection
- Test state synchronization timing
- Test cleanup functions

**Integration Tests:**
- Test full battle flow from matchmaking to completion
- Test reconnection scenarios
- Test token transfer flow
- Test simultaneous game over scenarios

**Manual Testing:**
- Play battles between two real players
- Test with intentional disconnections
- Verify piece sequences match between players
- Confirm garbage lines work correctly
