# TetriChain Deployment Information

## Deployment Details

**Network:** Sui Testnet
**Deployed:** November 25, 2024
**Transaction Digest:** HW2iz76awXbaGcPB2RGg18FreEYPfCB7wG2fakQxvt3Y

## Contract Addresses

### Package ID
```
0x774d3f8cb591c9181ca886a5dc765d5d36a38aea7c58cc2b13992cb95f70bfc0
```

### Shared Objects (Required for transactions)

**Leaderboard Object ID:**
```
0xa497dbdc60f5c948579978732ad810c4c533acfa0c4aaee292d03bd4baf2bc4f
```

**Token Treasury Object ID:**
```
0xbec66c4faf27c4e8411b637f1978eea16f277eda4d338972e8b027a804c5646a
```

### Immutable Objects

**Token Metadata (CoinMetadata<GAME>):**
```
0xa8bda5afc1b149f9b1f1b6abd236476a0ae289e3fe325ad4868f7e75d6af65d1
```

### Owned Objects

**Upgrade Cap (owned by deployer):**
```
0x8db8288d4a5a45e086c43e54d90247c0d75e6f56db74e939cb88d17832d8fbc2
```

## Token Information

- **Symbol:** TETRI
- **Name:** TetriChain Token
- **Decimals:** 9
- **Description:** Earn tokens by playing TetriChain - a web3 Tetris game

## Gas Cost

- **Storage Cost:** 35.058800 SUI
- **Computation Cost:** 1.000000 SUI
- **Storage Rebate:** 0.978120 SUI
- **Total Cost:** ~35.08 SUI

## Module Functions

### Entry Functions (callable from client)

1. **create_game_seed(random: &Random, clock: &Clock)**
   - Creates a new game seed for provably fair gameplay
   - Returns a GameSeed object to the caller

2. **submit_score(game_seed: &mut GameSeed, score: u64, leaderboard: &mut Leaderboard, treasury: &mut TokenTreasury, clock: &Clock)**
   - Submits a score to the leaderboard
   - Validates score and seed
   - Mints and transfers token rewards
   - Updates leaderboard if score is in top 10

### View Functions (read-only)

1. **get_leaderboard(leaderboard: &Leaderboard): vector<ScoreEntry>**
   - Returns the top 10 scores

2. **get_player_best_score(leaderboard: &Leaderboard, player: address): u64**
   - Returns a player's best score

3. **get_total_games(leaderboard: &Leaderboard): u64**
   - Returns total number of games played

4. **get_total_supply(treasury: &TokenTreasury): u64**
   - Returns total supply of tokens minted

## System Objects (Required for transactions)

**Random Object (Sui System):**
```
0x8
```

**Clock Object (Sui System):**
```
0x6
```

## Usage Examples

### Create Game Seed
```bash
sui client call \
  --package 0x774d3f8cb591c9181ca886a5dc765d5d36a38aea7c58cc2b13992cb95f70bfc0 \
  --module game \
  --function create_game_seed \
  --args 0x8 0x6 \
  --gas-budget 10000000
```

### Submit Score
```bash
sui client call \
  --package 0x774d3f8cb591c9181ca886a5dc765d5d36a38aea7c58cc2b13992cb95f70bfc0 \
  --module game \
  --function submit_score \
  --args <GAME_SEED_ID> <SCORE> 0xa497dbdc60f5c948579978732ad810c4c533acfa0c4aaee292d03bd4baf2bc4f 0xbec66c4faf27c4e8411b637f1978eea16f277eda4d338972e8b027a804c5646a 0x6 \
  --gas-budget 10000000
```

### Query Leaderboard
```bash
sui client call \
  --package 0x774d3f8cb591c9181ca886a5dc765d5d36a38aea7c58cc2b13992cb95f70bfc0 \
  --module game \
  --function get_leaderboard \
  --args 0xa497dbdc60f5c948579978732ad810c4c533acfa0c4aaee292d03bd4baf2bc4f \
  --gas-budget 10000000
```

## Explorer Links

- **Package:** https://testnet.suivision.xyz/package/0x774d3f8cb591c9181ca886a5dc765d5d36a38aea7c58cc2b13992cb95f70bfc0
- **Leaderboard:** https://testnet.suivision.xyz/object/0xa497dbdc60f5c948579978732ad810c4c533acfa0c4aaee292d03bd4baf2bc4f
- **Token Treasury:** https://testnet.suivision.xyz/object/0xbec66c4faf27c4e8411b637f1978eea16f277eda4d338972e8b027a804c5646a
- **Transaction:** https://testnet.suivision.xyz/txblock/HW2iz76awXbaGcPB2RGg18FreEYPfCB7wG2fakQxvt3Y

## Deployment Verification

### ✅ Leaderboard Object
- **Status:** Successfully deployed and initialized
- **Type:** Shared object (accessible by all users)
- **Initial State:**
  - `top_scores`: Empty vector (no scores yet)
  - `total_games`: 0
- **Verification:** Queried object successfully via `sui client object`

### ✅ Token Treasury Object
- **Status:** Successfully deployed and initialized
- **Type:** Shared object (accessible by all users)
- **Initial State:**
  - `supply.value`: 0 (no tokens minted yet)
- **Verification:** Queried object successfully via `sui client object`

### ✅ Contract Functions
All public entry functions are available:
- `create_game_seed()` - Ready to generate game seeds
- `submit_score()` - Ready to accept score submissions
- `get_leaderboard()` - Ready to query leaderboard
- `get_player_best_score()` - Ready to query player scores
- `get_total_games()` - Ready to query game statistics
- `get_total_supply()` - Ready to query token supply

### Next Steps
1. ✅ Contract deployed to testnet
2. ✅ Shared objects created and verified
3. ✅ Configuration file created for client (`tetrichain/client/src/config.js`)
4. ⏳ Ready for client integration (Task 8+)
