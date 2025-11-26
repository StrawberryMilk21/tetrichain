/// TetriChain Smart Contract
/// 
/// This module implements the core blockchain functionality for TetriChain:
/// - Game seed generation for provably fair gameplay
/// - On-chain leaderboard management
/// - Play-to-earn token rewards
/// - Score validation and submission

module tetris_game::game {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::balance::{Balance, Supply};
    use sui::clock::{Self, Clock};
    use sui::random::{Self, Random};
    use sui::event;
    use std::vector;
    use std::option;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use sui::display;
    use sui::package;

    // ===== Error Constants =====
    
    /// Score is outside valid range [0, 999999]
    const EInvalidScore: u64 = 1;
    
    /// Game seed doesn't exist or is invalid
    const EInvalidSeed: u64 = 2;
    
    /// Attempting to reuse an already-used seed
    const ESeedAlreadyUsed: u64 = 3;
    
    /// Score verification failed - doesn't match seed
    const EScoreVerificationFailed: u64 = 4;
    
    /// Insufficient gas for operation
    const EInsufficientGas: u64 = 5;
    
    /// Seed doesn't belong to the caller
    const EUnauthorized: u64 = 6;
    
    /// Username is invalid (not 3-16 chars or not alphanumeric)
    const EInvalidUsername: u64 = 7;
    
    /// Username is already taken
    const EUsernameTaken: u64 = 8;
    
    /// Address already has a username registered
    const EUsernameAlreadyRegistered: u64 = 9;
    
    /// Battle is not in the correct status for this operation
    const EInvalidBattleStatus: u64 = 10;
    
    /// Wager amounts don't match
    const EWagerMismatch: u64 = 11;
    
    /// Battle is already full
    const EBattleFull: u64 = 12;
    
    /// Not authorized to perform this action on the battle
    const ENotBattleParticipant: u64 = 13;
    
    /// Listing has expired
    const EListingExpired: u64 = 14;
    
    /// Payment amount doesn't match listing price
    const EPaymentMismatch: u64 = 15;
    
    /// Not authorized to cancel this listing
    const ENotListingOwner: u64 = 16;

    // ===== Structs =====
    
    /// One-time witness for token creation
    public struct GAME has drop {}
    
    // ===== Events =====
    
    /// Event emitted when tokens are minted as rewards
    public struct TokenMintEvent has copy, drop {
        player: address,
        amount: u64,
        score: u64,
    }
    
    /// Represents a player's score entry on the leaderboard
    public struct ScoreEntry has store, copy, drop {
        player: address,
        score: u64,
        timestamp: u64,
        game_seed_id: address,
    }
    
    /// Global leaderboard object storing top scores
    public struct Leaderboard has key {
        id: UID,
        top_scores: vector<ScoreEntry>,
        total_games: u64,
    }
    
    /// Game seed for provable fairness - ensures deterministic piece generation
    public struct GameSeed has key {
        id: UID,
        seed: vector<u8>,
        player: address,
        used: bool,
        created_at: u64,
    }
    
    /// Token treasury for minting game rewards
    public struct TokenTreasury has key {
        id: UID,
        supply: Supply<GAME>,
    }
    
    /// Username registry for player usernames
    public struct UsernameRegistry has key {
        id: UID,
        usernames: Table<address, String>,  // address → username
        addresses: Table<String, address>,  // username → address (for uniqueness)
    }
    
    /// Battle status constants
    const BATTLE_STATUS_WAITING: u8 = 0;
    const BATTLE_STATUS_ACTIVE: u8 = 1;
    const BATTLE_STATUS_ENDED: u8 = 2;
    
    /// Battle struct for PvP matches
    public struct Battle has key {
        id: UID,
        player1: address,
        player2: option::Option<address>,
        wager: u64,
        status: u8,  // 0=waiting, 1=active, 2=ended
        winner: option::Option<address>,
        created_at: u64,
        escrow: Balance<GAME>,  // Holds both players' wagers
    }
    
    /// BlockSkin NFT - customizable appearance for Tetris pieces
    public struct BlockSkin has key, store {
        id: UID,
        name: String,
        rarity: u8,  // 0=common, 1=rare, 2=epic, 3=legendary
        colors: vector<String>,  // 7 colors for 7 piece types (I, O, T, S, Z, J, L)
        creator: address,
        created_at: u64,
    }
    
    /// Marketplace listing for a BlockSkin NFT
    public struct Listing has key, store {
        id: UID,
        seller: address,
        price: u64,
        expires_at: u64,
        skin: BlockSkin,  // The NFT being sold
    }
    
    /// Marketplace fee collector
    public struct Marketplace has key {
        id: UID,
        fee_percentage: u64,  // Fee in basis points (250 = 2.5%)
        collected_fees: Balance<GAME>,
    }
    
    /// Game token that players earn
    public struct GameToken has key, store {
        id: UID,
        balance: Balance<GAME>,
    }

    // ===== Initialization =====
    
    /// Initialize the game system - called once on deployment
    /// Creates the leaderboard and token treasury
    fun init(witness: GAME, ctx: &mut TxContext) {
        // Create the leaderboard
        let leaderboard = Leaderboard {
            id: object::new(ctx),
            top_scores: vector::empty<ScoreEntry>(),
            total_games: 0,
        };
        
        // Create token treasury with zero supply initially
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9, // decimals
            b"TETRI",
            b"TetriChain Token",
            b"Earn tokens by playing TetriChain - a web3 Tetris game",
            option::none(),
            ctx
        );
        
        // Create treasury to hold the supply
        let treasury = TokenTreasury {
            id: object::new(ctx),
            supply: coin::treasury_into_supply(treasury_cap),
        };
        
        // Create username registry
        let username_registry = UsernameRegistry {
            id: object::new(ctx),
            usernames: table::new<address, String>(ctx),
            addresses: table::new<String, address>(ctx),
        };
        
        // Create marketplace with 2.5% fee (250 basis points)
        let marketplace = Marketplace {
            id: object::new(ctx),
            fee_percentage: 250,  // 2.5%
            collected_fees: sui::balance::zero<GAME>(),
        };
        
        // Share the leaderboard, treasury, username registry, and marketplace as shared objects
        transfer::share_object(leaderboard);
        transfer::share_object(treasury);
        transfer::share_object(username_registry);
        transfer::share_object(marketplace);
        
        // Freeze the metadata so it can't be changed
        transfer::public_freeze_object(metadata);
    }

    // ===== Public Functions =====
    
    /// Create a new game seed for provably fair gameplay using blockchain randomness
    /// This is an entry function that creates a GameSeed and transfers it to the caller
    /// 
    /// Requirements: 5.1, 5.2
    /// - Uses Sui randomness API for unpredictable seed generation
    /// - Stores seed on-chain with player address and timestamp
    /// - Returns seed to caller as an owned object
    public entry fun create_game_seed(
        random: &Random,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Generate random bytes using Sui's randomness API
        let mut generator = random::new_generator(random, ctx);
        let mut seed_bytes = vector::empty<u8>();
        let mut i = 0;
        
        // Generate 32 random bytes for the seed
        while (i < 32) {
            vector::push_back(&mut seed_bytes, random::generate_u8(&mut generator));
            i = i + 1;
        };
        
        // Create the GameSeed object
        let game_seed = GameSeed {
            id: object::new(ctx),
            seed: seed_bytes,
            player: tx_context::sender(ctx),
            used: false,
            created_at: clock::timestamp_ms(clock),
        };
        
        // Transfer the GameSeed to the caller
        transfer::transfer(game_seed, tx_context::sender(ctx));
    }
    
    /// Helper function for testing - create a game seed with specific bytes
    /// This allows tests to create deterministic seeds
    public fun create_game_seed_for_testing(seed_bytes: vector<u8>, ctx: &mut TxContext): GameSeed {
        GameSeed {
            id: object::new(ctx),
            seed: seed_bytes,
            player: tx_context::sender(ctx),
            used: false,
            created_at: 0,
        }
    }
    
    /// Get the seed bytes from a GameSeed object
    public fun get_seed(game_seed: &GameSeed): vector<u8> {
        game_seed.seed
    }
    
    /// Get the player address from a GameSeed object
    public fun get_player(game_seed: &GameSeed): address {
        game_seed.player
    }
    
    /// Check if a seed has been used
    public fun is_used(game_seed: &GameSeed): bool {
        game_seed.used
    }
    
    /// Get the creation timestamp
    public fun get_created_at(game_seed: &GameSeed): u64 {
        game_seed.created_at
    }
    
    // ===== Leaderboard Functions =====
    
    /// Submit a score to the leaderboard and claim token rewards
    /// 
    /// Requirements: 3.1, 3.2, 4.3, 4.5, 6.1, 6.2, 6.4
    /// - Validates score range (0-999,999)
    /// - Checks seed exists and is unused
    /// - Marks seed as used after submission
    /// - Updates leaderboard if score is in top 10
    /// - Mints and transfers token rewards
    /// - Emits token mint event
    public entry fun submit_score(
        game_seed: &mut GameSeed,
        score: u64,
        leaderboard: &mut Leaderboard,
        treasury: &mut TokenTreasury,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validation: Check score is in valid range [0, 999999]
        assert!(score <= 999999, EInvalidScore);
        
        // Validation: Check seed hasn't been used before
        assert!(!game_seed.used, ESeedAlreadyUsed);
        
        // Validation: Check seed belongs to the caller
        assert!(game_seed.player == sender, EUnauthorized);
        
        // Mark seed as used to prevent reuse
        game_seed.used = true;
        
        // Create score entry
        let score_entry = ScoreEntry {
            player: sender,
            score,
            timestamp: clock::timestamp_ms(clock),
            game_seed_id: object::uid_to_address(&game_seed.id),
        };
        
        // Update leaderboard
        update_leaderboard(leaderboard, score_entry);
        
        // Increment total games counter
        leaderboard.total_games = leaderboard.total_games + 1;
        
        // Mint and transfer token rewards
        mint_reward_tokens(treasury, score, sender, ctx);
        
        // Emit token mint event
        let token_amount = score / 100;
        if (token_amount > 0) {
            sui::event::emit(TokenMintEvent {
                player: sender,
                amount: token_amount,
                score,
            });
        };
    }
    
    /// Internal helper function to update the leaderboard with a new score
    /// 
    /// Requirements: 3.3, 3.4
    /// - Adds score to leaderboard if it's in top 10
    /// - Keeps only highest score per player
    /// - Sorts scores in descending order
    /// - Limits to 10 entries
    fun update_leaderboard(leaderboard: &mut Leaderboard, new_entry: ScoreEntry) {
        let top_scores = &mut leaderboard.top_scores;
        
        // Check if player already has a score on the leaderboard
        let mut existing_index = option::none<u64>();
        let mut i = 0;
        while (i < vector::length(top_scores)) {
            let entry = vector::borrow(top_scores, i);
            if (entry.player == new_entry.player) {
                existing_index = option::some(i);
                break
            };
            i = i + 1;
        };
        
        // If player has an existing score, only keep the higher one
        if (option::is_some(&existing_index)) {
            let idx = option::destroy_some(existing_index);
            let existing_entry = vector::borrow(top_scores, idx);
            
            if (new_entry.score > existing_entry.score) {
                // Remove old score
                vector::remove(top_scores, idx);
                // Add new score (will be sorted below)
                vector::push_back(top_scores, new_entry);
            } else {
                // New score is not better, don't add it
                return
            };
        } else {
            // Player doesn't have an existing score, add the new one
            vector::push_back(top_scores, new_entry);
        };
        
        // Sort scores in descending order (bubble sort for simplicity)
        let len = vector::length(top_scores);
        if (len > 1) {
            let mut i = 0;
            while (i < len - 1) {
                let mut j = 0;
                while (j < len - i - 1) {
                    let score_j = vector::borrow(top_scores, j).score;
                    let score_j1 = vector::borrow(top_scores, j + 1).score;
                    
                    if (score_j < score_j1) {
                        vector::swap(top_scores, j, j + 1);
                    };
                    j = j + 1;
                };
                i = i + 1;
            };
        };
        
        // Limit to top 10 entries
        while (vector::length(top_scores) > 10) {
            vector::pop_back(top_scores);
        };
    }
    
    /// Get the leaderboard (top 10 scores)
    /// 
    /// Requirements: 3.3, 3.5
    /// Returns a copy of the top scores vector
    public fun get_leaderboard(leaderboard: &Leaderboard): vector<ScoreEntry> {
        leaderboard.top_scores
    }
    
    /// Get a player's best score from the leaderboard
    /// 
    /// Requirements: 3.3, 3.5
    /// Returns the player's score if they're on the leaderboard, or 0 if not
    public fun get_player_best_score(leaderboard: &Leaderboard, player: address): u64 {
        let top_scores = &leaderboard.top_scores;
        let mut i = 0;
        
        while (i < vector::length(top_scores)) {
            let entry = vector::borrow(top_scores, i);
            if (entry.player == player) {
                return entry.score
            };
            i = i + 1;
        };
        
        // Player not found on leaderboard
        0
    }
    
    /// Get total number of games played
    public fun get_total_games(leaderboard: &Leaderboard): u64 {
        leaderboard.total_games
    }
    
    /// Get the number of entries on the leaderboard
    public fun get_leaderboard_size(leaderboard: &Leaderboard): u64 {
        vector::length(&leaderboard.top_scores)
    }
    
    /// Get a specific score entry from the leaderboard by index
    public fun get_score_entry(leaderboard: &Leaderboard, index: u64): ScoreEntry {
        *vector::borrow(&leaderboard.top_scores, index)
    }
    
    /// Get score entry fields for testing
    public fun get_entry_player(entry: &ScoreEntry): address {
        entry.player
    }
    
    public fun get_entry_score(entry: &ScoreEntry): u64 {
        entry.score
    }
    
    public fun get_entry_timestamp(entry: &ScoreEntry): u64 {
        entry.timestamp
    }
    
    // ===== Token Reward Functions =====
    
    /// Mint tokens as rewards for a player based on their score
    /// Formula: tokens = score / 100
    /// 
    /// Requirements: 4.1, 4.2
    /// - Calculates token rewards based on score
    /// - Mints tokens from the treasury supply
    /// - Transfers tokens to the player's address
    fun mint_reward_tokens(
        treasury: &mut TokenTreasury,
        score: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // Calculate token reward: tokens = score / 100
        let token_amount = score / 100;
        
        // Only mint if there are tokens to mint (score >= 100)
        if (token_amount > 0) {
            // Mint tokens from the treasury supply using balance::increase_supply
            let minted_balance = sui::balance::increase_supply(&mut treasury.supply, token_amount);
            
            // Create a Coin object with the minted balance
            let reward_coin = coin::from_balance(minted_balance, ctx);
            
            // Transfer the coin to the recipient
            transfer::public_transfer(reward_coin, recipient);
        };
    }
    
    /// Get the total supply of tokens minted
    public fun get_total_supply(treasury: &TokenTreasury): u64 {
        sui::balance::supply_value(&treasury.supply)
    }
    
    // ===== Username Registry Functions =====
    
    /// Validate username format (3-16 chars, alphanumeric)
    /// 
    /// Requirements: 10.2
    fun is_valid_username(username: &String): bool {
        let bytes = string::bytes(username);
        let len = vector::length(bytes);
        
        // Check length is between 3 and 16
        if (len < 3 || len > 16) {
            return false
        };
        
        // Check all characters are alphanumeric (a-z, A-Z, 0-9)
        let mut i = 0;
        while (i < len) {
            let byte = *vector::borrow(bytes, i);
            let is_digit = byte >= 48 && byte <= 57;  // 0-9
            let is_upper = byte >= 65 && byte <= 90;  // A-Z
            let is_lower = byte >= 97 && byte <= 122; // a-z
            
            if (!is_digit && !is_upper && !is_lower) {
                return false
            };
            i = i + 1;
        };
        
        true
    }
    
    /// Register a username for the caller's address
    /// 
    /// Requirements: 10.1, 10.2, 10.3, 10.4
    /// - Validates username format (3-16 chars, alphanumeric)
    /// - Checks username is not already taken
    /// - Checks address doesn't already have a username
    /// - Stores bidirectional mapping
    public entry fun register_username(
        registry: &mut UsernameRegistry,
        username: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate username format
        assert!(is_valid_username(&username), EInvalidUsername);
        
        // Check username is not already taken
        assert!(!table::contains(&registry.addresses, username), EUsernameTaken);
        
        // Check address doesn't already have a username
        assert!(!table::contains(&registry.usernames, sender), EUsernameAlreadyRegistered);
        
        // Store bidirectional mapping
        table::add(&mut registry.usernames, sender, username);
        table::add(&mut registry.addresses, username, sender);
    }
    
    /// Get username for an address
    /// 
    /// Requirements: 10.4
    /// Returns the username if registered, or an empty string if not
    public fun get_username(registry: &UsernameRegistry, player: address): String {
        if (table::contains(&registry.usernames, player)) {
            *table::borrow(&registry.usernames, player)
        } else {
            string::utf8(b"")
        }
    }
    
    /// Check if an address has a username registered
    /// 
    /// Requirements: 10.4
    public fun has_username(registry: &UsernameRegistry, player: address): bool {
        table::contains(&registry.usernames, player)
    }
    
    /// Check if a username is available
    public fun is_username_available(registry: &UsernameRegistry, username: String): bool {
        !table::contains(&registry.addresses, username)
    }
    
    // ===== Battle Manager Functions =====
    
    /// Create a new battle with a wager
    /// 
    /// Requirements: 1.1, 9.1
    /// - Creates a battle object with the specified wager
    /// - Locks the creator's wager in escrow
    /// - Shares the battle object so others can join
    public entry fun create_battle(
        wager: Coin<GAME>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let wager_amount = coin::value(&wager);
        let sender = tx_context::sender(ctx);
        
        // Create battle with player1 and wager locked in escrow
        let battle = Battle {
            id: object::new(ctx),
            player1: sender,
            player2: option::none(),
            wager: wager_amount,
            status: BATTLE_STATUS_WAITING,
            winner: option::none(),
            created_at: clock::timestamp_ms(clock),
            escrow: coin::into_balance(wager),
        };
        
        // Share the battle so player2 can join
        transfer::share_object(battle);
    }
    
    /// Join an existing battle as player2
    /// 
    /// Requirements: 1.2, 9.1
    /// - Validates wager matches the battle's wager
    /// - Locks player2's wager in escrow
    /// - Sets battle status to active
    public entry fun join_battle(
        battle: &mut Battle,
        wager: Coin<GAME>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let wager_amount = coin::value(&wager);
        
        // Validate battle is in waiting status
        assert!(battle.status == BATTLE_STATUS_WAITING, EInvalidBattleStatus);
        
        // Validate battle doesn't already have player2
        assert!(option::is_none(&battle.player2), EBattleFull);
        
        // Validate wager matches
        assert!(wager_amount == battle.wager, EWagerMismatch);
        
        // Add player2
        battle.player2 = option::some(sender);
        
        // Lock player2's wager in escrow
        sui::balance::join(&mut battle.escrow, coin::into_balance(wager));
        
        // Set battle status to active
        battle.status = BATTLE_STATUS_ACTIVE;
    }
    
    /// End a battle and transfer winnings to the winner
    /// 
    /// Requirements: 1.5, 9.2
    /// - Validates battle is active
    /// - Sets winner
    /// - Transfers both wagers to winner
    /// - Sets battle status to ended
    public entry fun end_battle(
        battle: &mut Battle,
        winner: address,
        ctx: &mut TxContext
    ) {
        // Validate battle is active
        assert!(battle.status == BATTLE_STATUS_ACTIVE, EInvalidBattleStatus);
        
        // Validate winner is one of the players
        let is_player1 = winner == battle.player1;
        let is_player2 = option::is_some(&battle.player2) && 
                         winner == *option::borrow(&battle.player2);
        assert!(is_player1 || is_player2, ENotBattleParticipant);
        
        // Set winner
        battle.winner = option::some(winner);
        
        // Transfer all escrowed funds to winner
        let total_wager = sui::balance::value(&battle.escrow);
        let winnings = sui::balance::split(&mut battle.escrow, total_wager);
        let winnings_coin = coin::from_balance(winnings, ctx);
        transfer::public_transfer(winnings_coin, winner);
        
        // Set battle status to ended
        battle.status = BATTLE_STATUS_ENDED;
    }
    
    /// Forfeit a battle (handles disconnections)
    /// 
    /// Requirements: 9.3
    /// - Can be called by either player
    /// - Transfers winnings to the opponent
    /// - Sets battle status to ended
    public entry fun forfeit_battle(
        battle: &mut Battle,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate battle is active
        assert!(battle.status == BATTLE_STATUS_ACTIVE, EInvalidBattleStatus);
        
        // Determine who is forfeiting and who wins
        let winner = if (sender == battle.player1) {
            // Player1 forfeits, player2 wins
            assert!(option::is_some(&battle.player2), EInvalidBattleStatus);
            *option::borrow(&battle.player2)
        } else if (option::is_some(&battle.player2) && sender == *option::borrow(&battle.player2)) {
            // Player2 forfeits, player1 wins
            battle.player1
        } else {
            // Sender is not a participant
            abort ENotBattleParticipant
        };
        
        // Set winner
        battle.winner = option::some(winner);
        
        // Transfer all escrowed funds to winner
        let total_wager = sui::balance::value(&battle.escrow);
        let winnings = sui::balance::split(&mut battle.escrow, total_wager);
        let winnings_coin = coin::from_balance(winnings, ctx);
        transfer::public_transfer(winnings_coin, winner);
        
        // Set battle status to ended
        battle.status = BATTLE_STATUS_ENDED;
    }
    
    /// Get battle information
    public fun get_battle_player1(battle: &Battle): address {
        battle.player1
    }
    
    public fun get_battle_player2(battle: &Battle): option::Option<address> {
        battle.player2
    }
    
    public fun get_battle_wager(battle: &Battle): u64 {
        battle.wager
    }
    
    public fun get_battle_status(battle: &Battle): u8 {
        battle.status
    }
    
    public fun get_battle_winner(battle: &Battle): option::Option<address> {
        battle.winner
    }
    
    public fun get_battle_escrow_value(battle: &Battle): u64 {
        sui::balance::value(&battle.escrow)
    }
    
    // ===== BlockSkin NFT Functions =====
    
    /// Mint a new BlockSkin NFT
    /// 
    /// Requirements: 6.1
    /// - Creates an NFT with unique visual properties
    /// - Transfers ownership to the creator
    public entry fun mint_skin(
        name: String,
        rarity: u8,
        colors: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate colors vector has exactly 7 colors (one for each piece type)
        assert!(vector::length(&colors) == 7, EInvalidScore); // Reusing error code
        
        // Create the BlockSkin NFT
        let skin = BlockSkin {
            id: object::new(ctx),
            name,
            rarity,
            colors,
            creator: sender,
            created_at: clock::timestamp_ms(clock),
        };
        
        // Transfer to creator
        transfer::public_transfer(skin, sender);
    }
    
    /// Transfer a BlockSkin NFT to another address
    /// 
    /// Requirements: 6.5
    public entry fun transfer_skin(
        skin: BlockSkin,
        recipient: address,
        _ctx: &mut TxContext
    ) {
        transfer::public_transfer(skin, recipient);
    }
    
    /// Get BlockSkin metadata
    public fun get_skin_name(skin: &BlockSkin): String {
        skin.name
    }
    
    public fun get_skin_rarity(skin: &BlockSkin): u8 {
        skin.rarity
    }
    
    public fun get_skin_colors(skin: &BlockSkin): vector<String> {
        skin.colors
    }
    
    public fun get_skin_creator(skin: &BlockSkin): address {
        skin.creator
    }
    
    public fun get_skin_created_at(skin: &BlockSkin): u64 {
        skin.created_at
    }
    
    // ===== NFT Marketplace Functions =====
    
    /// List a BlockSkin NFT on the marketplace
    /// 
    /// Requirements: 7.1
    /// - Creates a marketplace listing with price and expiration
    /// - Transfers NFT into the listing (escrow)
    public entry fun list_skin(
        skin: BlockSkin,
        price: u64,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        // Create listing
        let listing = Listing {
            id: object::new(ctx),
            seller: sender,
            price,
            expires_at: current_time + duration_ms,
            skin,
        };
        
        // Share the listing so anyone can buy it
        transfer::share_object(listing);
    }
    
    /// Buy a listed BlockSkin NFT
    /// 
    /// Requirements: 7.2, 7.5
    /// - Validates listing hasn't expired
    /// - Validates payment matches price
    /// - Transfers NFT to buyer
    /// - Transfers payment to seller (minus 2.5% fee)
    /// - Collects marketplace fee
    public entry fun buy_skin(
        listing: Listing,
        mut payment: Coin<GAME>,
        marketplace: &mut Marketplace,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let buyer = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        // Validate listing hasn't expired
        assert!(current_time < listing.expires_at, EListingExpired);
        
        // Validate payment matches price
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= listing.price, EPaymentMismatch);
        
        // Calculate marketplace fee (2.5%)
        let fee_amount = (listing.price * marketplace.fee_percentage) / 10000;
        let seller_amount = listing.price - fee_amount;
        
        // Split payment into fee and seller payment
        let fee_coin = coin::split(&mut payment, fee_amount, ctx);
        let seller_coin = coin::split(&mut payment, seller_amount, ctx);
        
        // Collect marketplace fee
        sui::balance::join(&mut marketplace.collected_fees, coin::into_balance(fee_coin));
        
        // Transfer payment to seller
        transfer::public_transfer(seller_coin, listing.seller);
        
        // Return any excess payment to buyer
        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, buyer);
        } else {
            coin::destroy_zero(payment);
        };
        
        // Destructure listing and transfer NFT to buyer
        let Listing { id, seller: _, price: _, expires_at: _, skin } = listing;
        object::delete(id);
        transfer::public_transfer(skin, buyer);
    }
    
    /// Cancel a marketplace listing
    /// 
    /// Requirements: 7.4
    /// - Returns NFT to seller
    /// - Deletes the listing
    public entry fun cancel_listing(
        listing: Listing,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Validate caller is the seller
        assert!(listing.seller == sender, ENotListingOwner);
        
        // Destructure listing and return NFT to seller
        let Listing { id, seller, price: _, expires_at: _, skin } = listing;
        object::delete(id);
        transfer::public_transfer(skin, seller);
    }
    
    /// Get listing information
    public fun get_listing_seller(listing: &Listing): address {
        listing.seller
    }
    
    public fun get_listing_price(listing: &Listing): u64 {
        listing.price
    }
    
    public fun get_listing_expires_at(listing: &Listing): u64 {
        listing.expires_at
    }
    
    public fun get_listing_skin_name(listing: &Listing): String {
        listing.skin.name
    }
    
    /// Get marketplace information
    public fun get_marketplace_fee_percentage(marketplace: &Marketplace): u64 {
        marketplace.fee_percentage
    }
    
    public fun get_marketplace_collected_fees(marketplace: &Marketplace): u64 {
        sui::balance::value(&marketplace.collected_fees)
    }
    
    // ===== Test-only Functions =====
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(GAME {}, ctx);
    }
}
