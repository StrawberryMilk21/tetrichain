# TetriChain React - Manual Testing Checklist

## Pre-Testing Setup

- [ ] Dev server running: `cd tetrichain/client && npm run dev`
- [ ] Browser open: http://localhost:3002
- [ ] OneChain wallet extension installed
- [ ] Wallet has testnet SUI (get from faucet if needed)
- [ ] Browser console open (F12) to check for errors

## 1. Initial Load

- [ ] Page loads without errors
- [ ] No console errors
- [ ] Title displays: "TetriChain"
- [ ] Subtitle displays: "Play Tetris, Earn Tokens on Sui"
- [ ] "Connect Wallet" button visible
- [ ] "Start Game" button visible
- [ ] Leaderboard section visible
- [ ] Token balance section visible

## 2. UI Without Wallet

### Menu Screen
- [ ] "Start Game" button is clickable
- [ ] Message shows: "Connect wallet to record scores on blockchain"
- [ ] Controls instructions visible
- [ ] Leaderboard shows "No scores yet" or existing scores

### Start Game (No Wallet)
- [ ] Click "Start Game"
- [ ] Game starts immediately (no blockchain transaction)
- [ ] Game board appears
- [ ] Score shows 0
- [ ] Level shows 1
- [ ] Lines shows 0
- [ ] First piece appears at top
- [ ] Piece starts falling

### Gameplay (No Wallet)
- [ ] ← key moves piece left
- [ ] → key moves piece right
- [ ] ↑ key rotates piece
- [ ] ↓ key soft drops (faster fall)
- [ ] Space key hard drops (instant fall)
- [ ] P key pauses game
- [ ] P key resumes game
- [ ] Pause overlay shows "PAUSED"
- [ ] Pieces lock when they hit bottom
- [ ] New pieces spawn after lock
- [ ] Lines clear when complete
- [ ] Score increases when lines clear
- [ ] Level increases every 10 lines
- [ ] Game speeds up with level

### Game Over (No Wallet)
- [ ] Game over screen appears when pieces stack to top
- [ ] Final score displays correctly
- [ ] "Play Again" button visible
- [ ] "Submit to Blockchain" button NOT visible (no wallet)
- [ ] Click "Play Again" returns to menu

## 3. Wallet Connection

### Connect Wallet
- [ ] Click "Connect Wallet" button
- [ ] OneChain wallet popup appears
- [ ] Approve connection in wallet
- [ ] Wallet address displays in UI
- [ ] Token balance displays (may be 0.00 TETRI)
- [ ] Message changes to: "Connected - scores will be recorded on blockchain"

### Wallet Display
- [ ] Address shows shortened format (0x1234...5678)
- [ ] Token balance shows "X.XX TETRI"
- [ ] "Refresh" button visible for balance
- [ ] Leaderboard loads automatically

## 4. Blockchain Game

### Create Game Seed
- [ ] Click "Start Game" with wallet connected
- [ ] Loading overlay appears: "Creating game seed on blockchain..."
- [ ] OneChain wallet popup appears
- [ ] Transaction details show in wallet
- [ ] Approve transaction in wallet
- [ ] Success toast appears: "Game seed created! Your game is provably fair."
- [ ] Game starts after seed creation
- [ ] Game board appears
- [ ] First piece appears

### Gameplay (With Blockchain)
- [ ] All controls work same as without wallet
- [ ] Game plays normally
- [ ] Score increases
- [ ] Lines clear
- [ ] Level increases
- [ ] No blockchain transactions during gameplay

### Game Over (With Blockchain)
- [ ] Game over screen appears
- [ ] Final score displays
- [ ] "Submit to Blockchain" button visible
- [ ] "Play Again" button visible

### Submit Score
- [ ] Click "Submit to Blockchain"
- [ ] Loading overlay appears: "Submitting score to blockchain..."
- [ ] OneChain wallet popup appears
- [ ] Transaction details show score
- [ ] Approve transaction in wallet
- [ ] Success toast appears: "Score submitted! You earned X TETRI tokens!"
- [ ] Leaderboard refreshes automatically
- [ ] New score appears in leaderboard
- [ ] Token balance increases
- [ ] Balance shows new amount

## 5. Leaderboard

### Display
- [ ] Shows top scores
- [ ] Each entry shows: rank, address, score, timestamp
- [ ] Addresses are shortened (0x1234...5678)
- [ ] Timestamps show relative time (e.g., "5m ago")
- [ ] Current player's score is highlighted
- [ ] Scores are sorted highest to lowest

### Refresh
- [ ] Click "Refresh" button
- [ ] Button shows "Loading..." while fetching
- [ ] Leaderboard updates with latest data
- [ ] No errors in console

## 6. Token Balance

### Display
- [ ] Shows current balance in TETRI
- [ ] Format: "X.XX TETRI"
- [ ] Updates after score submission

### Refresh
- [ ] Click "Refresh" button
- [ ] Button shows "Loading..." while fetching
- [ ] Balance updates with latest data
- [ ] No errors in console

## 7. Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to create game seed
- [ ] Error toast appears with helpful message
- [ ] Can still play offline (without blockchain)

### Wallet Rejection
- [ ] Start game with wallet connected
- [ ] Reject transaction in wallet
- [ ] Error toast appears
- [ ] Can try again or play offline

### Invalid Score
- [ ] Try to submit score without game seed
- [ ] Error toast appears with helpful message

### Insufficient Gas
- [ ] Try transaction with empty wallet
- [ ] Error toast appears with gas estimate
- [ ] Message suggests adding SUI

## 8. Multiple Games

### Sequential Games
- [ ] Play game 1, submit score
- [ ] Click "Play Again"
- [ ] Start new game (creates new seed)
- [ ] Play game 2, submit score
- [ ] Both scores appear in leaderboard
- [ ] Token balance reflects both games

### Without Submitting
- [ ] Play game, don't submit score
- [ ] Click "Play Again"
- [ ] Start new game
- [ ] Previous score not on blockchain
- [ ] New game works normally

## 9. Pause/Resume

### During Gameplay
- [ ] Press P to pause
- [ ] Game stops
- [ ] Pause overlay appears
- [ ] Piece stops falling
- [ ] Press P to resume
- [ ] Game continues
- [ ] Piece resumes falling
- [ ] Score/level unchanged

## 10. Responsive Design

### Desktop (1920x1080)
- [ ] Layout looks good
- [ ] All elements visible
- [ ] No overflow or scrolling issues

### Laptop (1366x768)
- [ ] Layout adapts
- [ ] All elements visible
- [ ] Readable text

### Tablet (768x1024)
- [ ] Layout stacks vertically
- [ ] Game board centered
- [ ] All features accessible

### Mobile (375x667)
- [ ] Layout works on small screen
- [ ] Touch controls needed (not implemented yet)
- [ ] Can still use keyboard on mobile with keyboard

## 11. Performance

### Game Loop
- [ ] Game runs at 60fps
- [ ] No stuttering or lag
- [ ] Smooth piece movement
- [ ] Responsive controls

### Blockchain Operations
- [ ] Transactions complete in reasonable time
- [ ] Loading states show during operations
- [ ] UI remains responsive during transactions

### Memory
- [ ] No memory leaks (check DevTools)
- [ ] Can play multiple games without issues
- [ ] Page doesn't slow down over time

## 12. Browser Compatibility

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Wallet connects

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Wallet connects

### Edge
- [ ] All features work
- [ ] No console errors
- [ ] Wallet connects

### Safari (if available)
- [ ] All features work
- [ ] No console errors
- [ ] Wallet connects

## 13. Console Checks

### No Errors
- [ ] No red errors in console
- [ ] No unhandled promise rejections
- [ ] No React warnings

### Expected Logs
- [ ] "Wallet connected successfully" when connecting
- [ ] "Game seed created successfully" when creating seed
- [ ] "Score submitted successfully" when submitting
- [ ] "Leaderboard fetched successfully" when loading

## 14. Edge Cases

### Empty Leaderboard
- [ ] Fresh contract shows "No scores yet"
- [ ] Message is clear and helpful

### First Score
- [ ] First score submission works
- [ ] Appears at #1 on leaderboard
- [ ] Token balance updates

### High Score
- [ ] Score over 100,000 displays correctly
- [ ] Commas in numbers (e.g., "123,456")
- [ ] Token calculation correct (score / 100)

### Zero Score
- [ ] Can submit score of 0
- [ ] Receives 0 tokens
- [ ] Appears on leaderboard

### Maximum Score
- [ ] Score near 999,999 works
- [ ] No overflow errors
- [ ] Displays correctly

## 15. Accessibility

### Keyboard Navigation
- [ ] Can tab through buttons
- [ ] Enter key activates buttons
- [ ] Focus visible on elements

### Screen Reader (if available)
- [ ] Buttons have descriptive labels
- [ ] Game state announced
- [ ] Errors announced

## Bug Report Template

If you find a bug, report it with:

```
**Bug**: [Brief description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Console Errors**: [Any errors from console]
**Browser**: [Chrome/Firefox/etc.]
**Wallet**: [OneChain/OneWallet]
**Screenshot**: [If applicable]
```

## Success Criteria

The conversion is successful if:
- [ ] All items in sections 1-10 pass
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] User experience is smooth
- [ ] Blockchain integration works reliably

## Notes

- Some features may not work if the smart contract is not deployed
- Testnet can be slow, be patient with transactions
- Keep browser console open to catch any errors
- Test with a fresh wallet to simulate new user experience
- Test with an existing wallet to simulate returning user

---

**Testing Date**: _______________
**Tester**: _______________
**Browser**: _______________
**Wallet**: _______________
**Result**: ☐ PASS  ☐ FAIL  ☐ NEEDS WORK
