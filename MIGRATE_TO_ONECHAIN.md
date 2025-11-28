# 🔄 Migrate Sui Project to OneChain Testnet

**Quick guide to migrate your Sui Move project from Sui Testnet to OneChain Testnet**

OneChain Testnet is Sui-compatible, so you can keep using Move contracts and Sui tools!

---

## ⏱️ Time Required: ~15 minutes

---

## 📋 Prerequisites

- Sui CLI installed
- Existing Sui Move project
- Wallet with OCT tokens (or access to faucet)

---

## 🚀 Migration Steps

### Step 1: Configure Sui CLI for OneChain (2 min)

```bash
# Add OneChain Testnet network
sui client new-env --alias onechain-testnet --rpc https://rpc-testnet.onelabs.cc:443

# Switch to OneChain
sui client switch --env onechain-testnet

# Verify you're on the right network
sui client active-env
```

Expected output: `onechain-testnet`

---

### Step 2: Import Your Wallet (1 min)

**Option A: Import existing wallet with recovery phrase**
```bash
sui keytool import "your twelve word recovery phrase here" ed25519
```

**Option B: Create new wallet**
```bash
sui client new-address ed25519
```

**Switch to your address:**
```bash
sui client switch --address YOUR_ADDRESS_HERE
```

---

### Step 3: Get OCT Tokens (1 min)

Visit: https://faucet-testnet.onelabs.cc/

Enter your wallet address and request tokens.

**Check your balance:**
```bash
sui client balance
```

You should see OCT tokens.

---

### Step 4: Deploy Contract (5 min)

```bash
# Navigate to your contract folder
cd contract

# Build the contract
sui move build

# Deploy to OneChain
sui client publish --gas-budget 100000000
```

**⚠️ IMPORTANT: Save these IDs from the deployment output:**
- Package ID
- Leaderboard ID (or equivalent shared objects)
- Treasury ID
- Any other shared object IDs your contract creates

---

### Step 5: Update Frontend Config (3 min)

**Update `client/src/config.js`:**

```javascript
// Change network configuration
export const NETWORK = 'onechain-testnet';
export const RPC_URL = 'https://rpc-testnet.onelabs.cc:443';

// Update explorer URL
export const EXPLORER_URL = 'https://explorer.onelabs.cc';

// Update contract IDs with your new deployment IDs
export const CONTRACT_CONFIG = {
    packageId: 'YOUR_NEW_PACKAGE_ID',
    leaderboardId: 'YOUR_NEW_LEADERBOARD_ID',
    treasuryId: 'YOUR_NEW_TREASURY_ID',
    // ... other IDs
    
    // Keep these the same
    randomId: '0x8',
    clockId: '0x6',
    
    // Update token type with new package ID
    token: {
        type: 'YOUR_NEW_PACKAGE_ID::your_module::YOUR_TOKEN',
        symbol: 'YOUR_SYMBOL',
        name: 'Your Token Name',
        decimals: 0,
    }
};
```

**Update `client/src/main.jsx`:**

```javascript
const networks = {
    'onechain-testnet': { url: 'https://rpc-testnet.onelabs.cc:443' },
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networks} defaultNetwork="onechain-testnet">
                <WalletProvider>
                    <App />
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
```

---

### Step 6: Update README (2 min)

Replace all mentions of:
- "Sui Testnet" → "OneChain Testnet"
- "https://testnet.suivision.xyz" → "https://explorer.onelabs.cc"
- "https://faucet.testnet.sui.io" → "https://faucet-testnet.onelabs.cc"
- Old Package ID → New Package ID

---

### Step 7: Test Everything (5 min)

```bash
# Start your frontend
cd client
npm run dev
```

1. Open http://localhost:5173
2. Connect OneWallet (make sure it's on OneChain Testnet!)
3. Test all blockchain interactions:
   - Create game seed / initialize
   - Submit transactions
   - Query data
   - Check token balances

---

## 🔧 Troubleshooting

### "Cannot find gas coin" error
Your OCT tokens might not be recognized as gas. Try:
```bash
sui client objects
```
Find a coin object ID and use it explicitly:
```bash
sui client publish --gas YOUR_COIN_OBJECT_ID --gas-budget 100000000
```

### "Network not found" error
Make sure you ran the `sui client new-env` command correctly:
```bash
sui client envs
```
Should show `onechain-testnet` in the list.

### Wallet won't connect
1. Make sure OneWallet extension is on OneChain Testnet network
2. Refresh the page
3. Check browser console for errors

### Contract deployment fails
1. Check you have enough OCT tokens: `sui client balance`
2. Try increasing gas budget: `--gas-budget 200000000`
3. Make sure you're on the right network: `sui client active-env`

---

## 📚 OneChain Resources

- **RPC URL**: https://rpc-testnet.onelabs.cc:443
- **Explorer**: https://explorer.onelabs.cc/
- **Faucet**: https://faucet-testnet.onelabs.cc/
- **Documentation**: Check OneChain official docs

---

## ✅ Checklist

- [ ] Configured Sui CLI for OneChain
- [ ] Imported/created wallet
- [ ] Got OCT tokens from faucet
- [ ] Deployed contract successfully
- [ ] Saved all deployment IDs
- [ ] Updated `config.js` with new IDs
- [ ] Updated `main.jsx` with OneChain RPC
- [ ] Updated README with OneChain info
- [ ] Tested frontend connection
- [ ] Tested all blockchain features

---

## 💡 Pro Tips

1. **Keep your old Sui Testnet deployment** - You can switch between networks easily
2. **Save deployment output** - Copy the entire terminal output to a text file
3. **Test incrementally** - Test each feature after migration
4. **Check explorer** - Verify your transactions on https://explorer.onelabs.cc/
5. **Gas is cheap** - Don't worry about gas costs on testnet

---

## 🎉 That's It!

Your project is now running on OneChain Testnet! The best part? Your Move contracts didn't change at all - OneChain is fully Sui-compatible!

**Questions?** Share this guide with your team! 🚀
