# OneChain Testnet Deployment Guide

This guide will help you deploy TetriChain smart contracts to OneChain Testnet.

## Prerequisites

- Sui CLI installed ([Download](https://docs.sui.io/build/install))
- OneWallet browser extension
- OCT tokens from faucet

## Step 1: Configure Sui CLI for OneChain

```bash
# Add OneChain Testnet network
sui client new-env --alias onechain-testnet --rpc https://rpc-testnet.onelabs.cc:443

# Switch to OneChain Testnet
sui client switch --env onechain-testnet

# Verify you're on the right network
sui client active-env
```

## Step 2: Get Test Tokens

Visit the OneChain Faucet to get free OCT tokens:
https://faucet-testnet.onelabs.cc/

Enter your wallet address and request tokens.

## Step 3: Build the Contract

```bash
cd contract
sui move build
```

If the build is successful, you'll see output like:
```
BUILDING game
Successfully verified dependencies on-chain against source.
```

## Step 4: Deploy the Contract

```bash
sui client publish --gas-budget 100000000
```

This will deploy your contract to OneChain Testnet. The deployment takes about 10-30 seconds.

## Step 5: Save Deployment Information

After successful deployment, you'll see output with important IDs. **SAVE THESE!**

Example output:
```
╭──────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                      │
│  ┌──                                                                  │
│  │ ObjectID: 0xABCD...                                               │
│  │ Sender: 0x1234...                                                 │
│  │ Owner: Shared                                                     │
│  │ ObjectType: 0xPACKAGE_ID::game::Leaderboard                      │
│  └──                                                                  │
╰──────────────────────────────────────────────────────────────────────╯
```

You need to save:
- **Package ID** - The main contract address
- **Leaderboard ID** - Shared object for leaderboard
- **Treasury ID** - Token treasury capability
- **Username Registry ID** - Username management
- **Marketplace ID** - NFT marketplace

## Step 6: Update Frontend Configuration

Update `client/src/config.js` with your new IDs:

```javascript
export const CONTRACT_CONFIG = {
    packageId: 'YOUR_PACKAGE_ID',
    leaderboardId: 'YOUR_LEADERBOARD_ID',
    treasuryId: 'YOUR_TREASURY_ID',
    usernameRegistryId: 'YOUR_USERNAME_REGISTRY_ID',
    marketplaceId: 'YOUR_MARKETPLACE_ID',
    
    // These stay the same
    randomId: '0x8',
    clockId: '0x6',
    moduleName: 'game',
    
    token: {
        type: 'YOUR_PACKAGE_ID::game::GAME',
        symbol: 'TETRI',
        name: 'TetriChain Token',
        decimals: 0,
    }
};
```

## Step 7: Verify Deployment

Visit OneChain Explorer to verify your deployment:
https://explorer.onelabs.cc/

Search for your Package ID to see your deployed contract.

## Step 8: Test the Application

1. Start the frontend:
```bash
cd client
npm run dev
```

2. Open http://localhost:5173 in your browser

3. Connect your OneWallet (make sure it's on OneChain Testnet)

4. Try creating a game seed and playing!

## Troubleshooting

### "Insufficient gas" error
- Get more OCT tokens from the faucet
- Increase gas budget: `--gas-budget 200000000`

### "Network not found" error
- Make sure you ran `sui client new-env` correctly
- Check you're on the right network: `sui client active-env`

### "Object not found" error
- Double-check all IDs in config.js
- Make sure you copied the correct object IDs from deployment output

### Wallet won't connect
- Make sure OneWallet is on OneChain Testnet network
- Try refreshing the page
- Check browser console for errors

## Upgrading the Contract

If you need to upgrade your contract later:

```bash
cd contract
sui move build
sui client upgrade --gas-budget 100000000 --upgrade-capability YOUR_UPGRADE_CAP_ID
```

## Network Information

- **Network Name**: OneChain Testnet
- **RPC URL**: https://rpc-testnet.onelabs.cc:443
- **Explorer**: https://explorer.onelabs.cc/
- **Faucet**: https://faucet-testnet.onelabs.cc/
- **Chain ID**: (Check OneChain docs)

## Support

If you encounter issues:
1. Check OneChain documentation
2. Verify all configuration is correct
3. Check browser console for errors
4. Make sure you have enough OCT tokens

---

**Note**: OneChain Testnet is Sui-compatible, so all Sui Move contracts and tools work the same way!
