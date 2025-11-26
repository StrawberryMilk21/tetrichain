# OneChain Wallet Integration Issue

## Problem
OneChain wallet keeps rejecting our transactions with the error:
```
Error: Unexpect transaction format found. Ensure that you are using the `Transaction` class.
```

## What We've Tried
1. ✅ Connected to OneChain wallet successfully using `window.onechain.sui`
2. ✅ Switched to Sui Testnet in the wallet
3. ✅ Used both `TransactionBlock` (from `@mysten/sui.js`) and `Transaction` (from `@mysten/sui`)
4. ✅ Tried `signAndExecuteTransactionBlock`, `signAndExecuteTransaction`, and `signTransactionBlock`
5. ✅ Tried serializing transactions to bytes
6. ✅ Added sender address, account, and chain parameters
7. ❌ All attempts result in the same error

## Current Package Versions
- `@mysten/sui.js`: ^0.54.1
- `@mysten/sui`: ^1.45.0

## Questions for Your Friend
Please ask your friend these questions:

1. **What exact versions of the Sui SDK are they using?**
   ```bash
   npm list @mysten/sui
   npm list @mysten/sui.js
   ```

2. **What version of OneChain wallet extension do they have installed?**
   - Check in the extension settings

3. **Can they share their exact transaction building code?**
   - Specifically how they create and sign transactions

4. **Are they using any additional libraries or wrappers?**
   - Sometimes projects use helper libraries that handle wallet compatibility

5. **What does their package.json dependencies section look like?**

## Temporary Workaround
For now, the game falls back to using a random seed (not blockchain-verified) when wallet transactions fail. This allows you to:
- Play the game normally
- Test all game mechanics
- But scores won't be submitted to the blockchain

## Next Steps
Once we get the information from your friend, we can:
1. Match their exact SDK versions
2. Update our transaction building code to match theirs
3. Test with the correct configuration

## Alternative Solution
If OneChain continues to be problematic, we could:
1. Use Sui Wallet instead (the official Sui wallet)
2. Use Ethos Wallet (another popular Sui wallet)
3. Both of these have better documentation and are more widely supported
