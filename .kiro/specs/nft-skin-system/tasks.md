# Implementation Plan

## Phase 1: Disable Multiplayer & Setup

- [x] 1. Disable multiplayer feature


  - Show "Coming Soon" message when multiplayer button is clicked
  - Prevent navigation to multiplayer screens
  - _Requirements: 1.1, 1.2_

- [x] 2. Define skin configurations


  - Create skin data with IDs, names, unlock scores, and colors
  - Add 3 skins: Neon Block (1000), Galaxy Block (5000), Diamond Block (10000)
  - _Requirements: 2.1, 2.2, 2.3_

## Phase 2: Smart Contract - Skin NFT System

- [x] 3. Update Move contract with skin NFT module

  - [x] 3.1 Create SkinNFT struct with skin_id, name, minted_at, owner

    - _Requirements: 7.1_
  
  - [x] 3.2 Implement mint_skin function

    - Takes skin_id and mints unique NFT
    - Emits mint event
    - _Requirements: 3.2, 3.3, 7.1_
  
  - [x] 3.3 Add skin metadata getter functions

    - _Requirements: 7.1_

## Phase 3: Smart Contract - Marketplace

- [x] 4. Implement marketplace module

  - [x] 4.1 Create Listing struct and marketplace shared object

    - _Requirements: 7.2_
  
  - [x] 4.2 Implement list_skin function

    - Escrow NFT, create listing with price
    - _Requirements: 5.1, 7.2_
  
  - [x] 4.3 Implement buy_skin function

    - Transfer payment to seller, transfer NFT to buyer
    - Atomic transaction
    - _Requirements: 5.2, 5.3, 7.3_
  
  - [x] 4.4 Implement cancel_listing function

    - Return NFT to seller, remove listing
    - _Requirements: 5.5_

## Phase 4: Smart Contract - Username Fix

- [x] 5. Integrate username registry (already exists in contract)


  - [x] 5.1 Verify register_username function exists

    - _Requirements: 6.2, 7.4_
  
  - [x] 5.2 Verify get_username function exists

    - _Requirements: 6.3, 7.5_

## Phase 5: Deploy Smart Contract

- [x] 6. Deploy updated contract to Sui testnet



  - Build and deploy contract
  - Update packageId in config.js
  - Save new object IDs (marketplace, etc.)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

## Phase 6: Frontend - Milestone & Unlock System

- [x] 7. Implement milestone detection



  - [x] 7.1 Create useSkinUnlocks hook


    - Check score against milestone thresholds
    - Store unlocked skins in localStorage
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 7.2 Add unlock notification component


    - Toast notification when milestone reached
    - _Requirements: 2.4_
  
  - [x] 7.3 Integrate milestone check into game loop


    - Call check after score updates
    - _Requirements: 2.1, 2.2, 2.3_

## Phase 7: Frontend - NFT Claiming

- [x] 8. Implement claim NFT functionality


  - [x] 8.1 Create claimSkinNFT function



    - Call smart contract mint_skin
    - Update claimed status in localStorage
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [x] 8.2 Add claim button to unlocked skins


    - Show "Claim as NFT" for unclaimed skins
    - Show "Claimed" for claimed skins
    - _Requirements: 3.1, 3.4_
  
  - [x] 8.3 Handle claim errors


    - Show error toast, allow retry
    - _Requirements: 3.5_

## Phase 8: Frontend - Customization Menu

- [x] 9. Create customization UI



  - [x] 9.1 Build CustomizationMenu component




    - Display all unlocked skins as grid
    - Show lock icon for locked skins
    - _Requirements: 4.1, 4.4_
  
  - [x] 9.2 Implement skin selection

    - Apply selected skin to game blocks
    - Save selection to localStorage
    - _Requirements: 4.2, 4.3_
  
  - [x] 9.3 Create skin preview

    - Show block colors for each skin
    - _Requirements: 4.1_

## Phase 9: Frontend - Marketplace

- [x] 10. Build marketplace UI



  - [x] 10.1 Create MarketplaceView component


    - Display all listed NFTs with prices
    - _Requirements: 5.4_
  
  - [x] 10.2 Implement list NFT functionality

    - Form to enter price
    - Call smart contract list_skin
    - _Requirements: 5.1_
  
  - [x] 10.3 Implement buy NFT functionality

    - Buy button for each listing
    - Call smart contract buy_skin
    - Update local inventory
    - _Requirements: 5.2, 5.3_
  
  - [x] 10.4 Implement cancel listing

    - Cancel button for own listings
    - Call smart contract cancel_listing
    - _Requirements: 5.5_

## Phase 10: Frontend - Username System Fix

- [x] 11. Fix username registration flow


  - [x] 11.1 Create UsernamePrompt component


    - Modal for first-time users
    - Input field with validation
    - _Requirements: 6.1_
  
  - [x] 11.2 Implement on-chain username registration


    - Call smart contract register_username
    - Store username in localStorage as cache
    - _Requirements: 6.2, 6.3_
  
  - [x] 11.3 Check username on app load


    - Query contract for existing username
    - Skip prompt if already registered
    - _Requirements: 6.3, 6.5_
  
  - [x] 11.4 Update leaderboard to show usernames


    - Fetch usernames for all addresses
    - Display username instead of address
    - Fall back to address if no username
    - _Requirements: 6.4_
  
  - [x] 11.5 Handle registration errors


    - Allow retry or continue with address
    - _Requirements: 6.6_

## Phase 11: Integration & Polish

- [x] 12. Connect all systems


  - Wire customization menu to main menu
  - Wire marketplace to main menu
  - Test full flow: play → unlock → claim → customize → trade
  - _Requirements: All_

- [-] 13. Final testing and bug fixes

  - Test on testnet with real transactions
  - Verify NFTs appear in Sui wallet
  - Test marketplace trades between accounts
  - Verify leaderboard shows usernames
  - _Requirements: All_
