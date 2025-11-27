# Requirements Document

## Introduction

This specification defines the requirements for completing the multiplayer Tetris battle functionality in TetriChain. The system currently has working matchmaking and WebSocket infrastructure, but needs refinement of the gameplay mechanics, real-time synchronization, and game completion flow.

## Glossary

- **Battle Room**: A multiplayer game session between two players
- **Game State**: The current state of a Tetris game including grid, pieces, score, and level
- **Opponent State**: The game state of the other player in a battle
- **Game Seed**: A deterministic seed used to generate identical piece sequences for both players
- **Garbage Lines**: Incomplete lines sent to opponent when clearing multiple lines
- **Game Over Modal**: UI component showing battle results and winner
- **Token Transfer**: Blockchain transaction transferring wager from loser to winner

## Requirements

### Requirement 1

**User Story:** As a player, I want the Tetris game to run smoothly in multiplayer mode with falling blocks, so that I can play competitively against my opponent.

#### Acceptance Criteria

1. WHEN a multiplayer battle starts THEN the Tetris game SHALL begin with blocks falling at the same speed as solo mode
2. WHEN a player presses movement keys THEN the current piece SHALL respond immediately without lag
3. WHEN a piece is placed THEN the next piece SHALL spawn immediately from the queue
4. WHEN the hold function is used THEN the piece SHALL be swapped with the held piece correctly
5. WHEN lines are cleared THEN the clearing animation SHALL play and new pieces SHALL continue falling

### Requirement 2

**User Story:** As a player, I want to see my opponent's game board in real-time, so that I can track their progress and adjust my strategy.

#### Acceptance Criteria

1. WHEN the opponent places a piece THEN their game board SHALL update within 200ms on my screen
2. WHEN the opponent's current piece moves THEN the movement SHALL be visible on my screen
3. WHEN the opponent clears lines THEN the clearing animation SHALL be visible on their board
4. WHEN the opponent's score changes THEN the updated score SHALL display immediately
5. WHEN the opponent uses hold THEN their held piece SHALL update on my screen

### Requirement 3

**User Story:** As a player, I want both players to receive the same sequence of Tetris pieces, so that the competition is fair and skill-based.

#### Acceptance Criteria

1. WHEN a battle room is created THEN a shared game seed SHALL be generated
2. WHEN both players start the game THEN they SHALL receive identical piece sequences
3. WHEN a player spawns their 10th piece THEN the opponent SHALL have the same 10th piece available
4. WHEN the game progresses THEN the next queue SHALL remain synchronized between players
5. WHEN a player uses hold THEN it SHALL not affect the opponent's piece sequence

### Requirement 4

**User Story:** As a player, I want to send garbage lines to my opponent when I clear multiple lines, so that I can gain a competitive advantage.

#### Acceptance Criteria

1. WHEN a player clears 2 lines simultaneously THEN 1 garbage line SHALL be sent to the opponent
2. WHEN a player clears 3 lines simultaneously THEN 2 garbage lines SHALL be sent to the opponent
3. WHEN a player clears 4 lines simultaneously THEN 4 garbage lines SHALL be sent to the opponent
4. WHEN garbage lines are received THEN they SHALL be added to the bottom of the player's grid
5. WHEN garbage lines are added THEN the existing blocks SHALL shift upward

### Requirement 5

**User Story:** As a player, I want to see a clear game over screen when the battle ends, so that I know who won and what happens next.

#### Acceptance Criteria

1. WHEN a player's grid fills to the top THEN the game SHALL end immediately
2. WHEN the game ends THEN a modal SHALL display showing the winner and loser
3. WHEN the modal displays THEN it SHALL show both players' final scores
4. WHEN the modal displays THEN it SHALL show the wager amount
5. WHEN the modal displays THEN it SHALL provide options to play again or return to menu

### Requirement 6

**User Story:** As a winner, I want to automatically receive the wager tokens from my opponent, so that I am rewarded for my victory.

#### Acceptance Criteria

1. WHEN a player wins THEN a blockchain transaction SHALL be initiated to transfer tokens
2. WHEN the transaction is initiated THEN the winner SHALL receive the full wager amount
3. WHEN the transaction completes THEN both players SHALL see a confirmation message
4. WHEN the transaction fails THEN an error message SHALL be displayed
5. WHEN the transaction completes THEN the battle room SHALL be closed

### Requirement 7

**User Story:** As a player, I want to return to the main menu after a battle ends, so that I can start a new game or exit.

#### Acceptance Criteria

1. WHEN a player clicks "Back to Menu" on the game over modal THEN they SHALL return to the main menu
2. WHEN a player clicks "Play Again" THEN they SHALL enter the matchmaking queue
3. WHEN returning to menu THEN the battle room SHALL be properly cleaned up
4. WHEN returning to menu THEN all WebSocket listeners SHALL be removed
5. WHEN returning to menu THEN the game state SHALL be reset

### Requirement 8

**User Story:** As a player, I want the game to handle disconnections gracefully, so that I don't lose unfairly due to network issues.

#### Acceptance Criteria

1. WHEN a player disconnects THEN the opponent SHALL be notified within 5 seconds
2. WHEN a player disconnects THEN a 10-second grace period SHALL begin
3. WHEN a player reconnects within the grace period THEN the game SHALL resume
4. WHEN the grace period expires THEN the disconnected player SHALL forfeit
5. WHEN a player forfeits THEN the opponent SHALL be declared the winner
