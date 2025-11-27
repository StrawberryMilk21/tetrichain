# Implementation Plan

- [x] 1. Fix game loop and piece falling mechanics



  - Ensure game loop runs independently without blocking on state updates
  - Verify pieces fall at correct intervals matching solo mode
  - Test that keyboard inputs work without lag
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement real-time opponent state visualization



  - Update BattleView to properly render opponent's grid
  - Display opponent's current piece and ghost piece
  - Show opponent's next queue and hold piece
  - Update opponent's score and stats in real-time
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Ensure deterministic piece generation



  - Verify both players use roomId as game seed
  - Test that piece sequences match between players
  - Add logging to confirm seed synchronization
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Implement garbage line mechanics
  - Add garbage line calculation based on lines cleared
  - Implement server relay for garbage events
  - Add client handler to receive and apply garbage lines
  - Create visual feedback for garbage being sent/received
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Create game over modal component
  - Design and implement GameOverModal component
  - Display winner, loser, scores, and wager
  - Add "Play Again" and "Back to Menu" buttons
  - Show loading state during token transfer
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Implement token transfer on game completion
  - Integrate blockchain service for token transfers
  - Handle winner receiving wager from loser
  - Show transaction confirmation to both players
  - Handle transaction errors gracefully
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Implement post-game navigation
  - Handle "Back to Menu" button click
  - Handle "Play Again" button to rejoin matchmaking
  - Clean up battle room on server
  - Remove all WebSocket event listeners
  - Reset game state properly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Add disconnection handling
  - Implement grace period timer on server
  - Show disconnection notification to opponent
  - Handle reconnection within grace period
  - Auto-forfeit after grace period expires
  - Declare opponent as winner on forfeit
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. Final testing and polish
  - Test complete battle flow end-to-end
  - Verify all requirements are met
  - Fix any remaining bugs
  - Optimize performance if needed
  - _Requirements: All_
