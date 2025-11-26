# TetriChain Multiplayer Deployment Info

## Deployment Date
November 26, 2025

## Network
Sui Testnet

## Package ID
`0x4bf5f75d851120181674181a8a6048f4d1a7980a3e8e529f18f23f5cbf41f8b7`

## Shared Objects

### Leaderboard
- **Object ID**: `0xf1b0f2e1dc255b865878d527d32f731ca2b189c5c28a2a644e7dc51425449f28`
- **Type**: `game::Leaderboard`
- **Version**: 667427471

### TokenTreasury
- **Object ID**: `0xd0b57ab010a2a6f2976dd151afc5009e234b64019d7a2a584221bc8d5d936944`
- **Type**: `game::TokenTreasury`
- **Version**: 667427471

### UsernameRegistry
- **Object ID**: `0x68bbdeb830d13734575943a863e86850e882c8afd7df4fe57780431ad232464f`
- **Type**: `game::UsernameRegistry`
- **Version**: 667427471

### Marketplace
- **Object ID**: `0x1f5d93361cd9b6bb32de1000798d8d581603ca6e19a905700548731a5884beea`
- **Type**: `game::Marketplace`
- **Version**: 667427471

## Immutable Objects

### CoinMetadata (TETRI Token)
- **Object ID**: `0xc14ada5c7562bb05f10b084101dbef95ace1cb820f8c10e8ee7fdbf73209e228`
- **Type**: `0x2::coin::CoinMetadata<GAME>`

## Transaction
- **Digest**: `AwKGXVAg7B2upn3hDbb8Q5q321w7Xtdbkee1ff4MXq2c`
- **Status**: Success
- **Epoch**: 930

## Gas Cost
- Storage Cost: 64.5468 SUI
- Computation Cost: 0.001 SUI
- Total: ~64.55 SUI

## Next Steps
1. Update frontend config.js with new package ID and object IDs
2. Test username registration
3. Test battle creation and joining
4. Test NFT minting and marketplace
