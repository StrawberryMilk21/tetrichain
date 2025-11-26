# Bug Fix: GameSeed Object Not Found

## Issue

After connecting wallet and clicking "Start Game", the transaction was signed successfully but resulted in error:
```
Failed to start game: Error: GameSeed object not found in transaction result
```

## Root Cause

The `@mysten/dapp-kit`'s `useSignAndExecuteTransaction` hook returns a simplified transaction result that **does not include `objectChanges` by default**. 

The original code was trying to access `result.objectChanges` directly:
```javascript
const createdObjects = result.objectChanges?.filter(...)
```

But `result.objectChanges` was `undefined` because dapp-kit doesn't include it in the immediate response.

## Solution

We need to fetch the full transaction details using `client.getTransactionBlock()` after the transaction is executed:

### Before (Broken)
```javascript
signAndExecuteTransaction(
    { transaction: tx },
    {
        onSuccess: async (result) => {
            // ❌ result.objectChanges is undefined
            const createdObjects = result.objectChanges?.filter(...)
        }
    }
);
```

### After (Fixed)
```javascript
signAndExecuteTransaction(
    { transaction: tx },
    {
        onSuccess: async (result) => {
            // ✅ Wait for transaction to be indexed
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // ✅ Fetch full transaction details
            const txDetails = await client.getTransactionBlock({
                digest: result.digest,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                }
            });
            
            // ✅ Now objectChanges is available
            const createdObjects = txDetails.objectChanges?.filter(...)
        }
    }
);
```

## Changes Made

### File: `src/hooks/useBlockchain.js`

1. **Added transaction detail fetching** in `createGameSeed()`:
   - Wait 1 second for transaction to be indexed
   - Fetch full transaction details with `client.getTransactionBlock()`
   - Extract `objectChanges` from the detailed result

2. **Added better logging**:
   - Log transaction result
   - Log transaction digest
   - Log transaction details
   - Log GameSeed object ID
   - Log extracted seed

3. **Improved error handling**:
   - Log errors at each step
   - Provide context in error messages

## Why the 1-Second Wait?

The blockchain needs a moment to index the transaction before we can query its details. Without this wait, `getTransactionBlock()` might return incomplete data or fail.

This is a common pattern when working with blockchain transactions:
1. Submit transaction
2. Wait for confirmation
3. Wait for indexing
4. Query full details

## Testing

After this fix:
1. ✅ Connect wallet
2. ✅ Click "Start Game"
3. ✅ Sign transaction in wallet
4. ✅ Transaction executes successfully
5. ✅ GameSeed object is found
6. ✅ Seed bytes are extracted
7. ✅ Game starts with blockchain seed

## Additional Notes

### Why Not Use Options in signAndExecuteTransaction?

You might think we could pass options like this:
```javascript
signAndExecuteTransaction(
    { 
        transaction: tx,
        options: {
            showObjectChanges: true
        }
    }
)
```

However, dapp-kit's `useSignAndExecuteTransaction` doesn't support these options in the same way. The options need to be passed to `getTransactionBlock()` instead.

### Alternative Approaches

1. **Polling**: Instead of a fixed 1-second wait, we could poll until the transaction is indexed
2. **Event Listening**: Listen for transaction confirmation events
3. **Optimistic UI**: Start the game immediately and fetch seed in background

For now, the 1-second wait is simple and reliable for testnet.

## Related Files

- `src/hooks/useBlockchain.js` - Main fix location
- `src/App.jsx` - Error handling (already good)
- `src/components/Toast.jsx` - Error display (already good)

## Status

✅ **FIXED** - Game seed creation now works correctly with OneChain wallet via dapp-kit.

## Next Steps

Test the complete flow:
1. Connect wallet ✅
2. Create game seed ✅
3. Play game
4. Submit score
5. Verify leaderboard updates
6. Verify token balance increases
