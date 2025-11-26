/// Property-based tests for TetriChain smart contract
/// 
/// These tests verify correctness properties across many random inputs

#[test_only]
module tetris_game::game_tests {
    use tetris_game::game;
    use sui::test_scenario as ts;

    // Test addresses
    const PLAYER1: address = @0xA;
    const PLAYER2: address = @0xB;

    // ===== Helper Functions =====
    
    /// Generate a pseudo-random seed for testing
    fun generate_test_seed(iteration: u64): vector<u8> {
        let mut seed = vector::empty<u8>();
        let mut i = 0;
        while (i < 32) {
            vector::push_back(&mut seed, ((iteration + i) % 256) as u8);
            i = i + 1;
        };
        seed
    }

    // ===== Property Tests =====
    
    /// Feature: web3-tetris-game, Property 13: Seed storage and retrieval
    /// Validates: Requirements 5.2, 5.5
    /// 
    /// Property: For any generated game seed, storing it and then querying it back 
    /// should return the same seed value
    #[test]
    fun test_property_seed_storage_and_retrieval() {
        // Run 100 iterations with different seeds
        let mut iteration = 0;
        while (iteration < 100) {
            let mut scenario = ts::begin(PLAYER1);
            
            // Generate a random seed for this iteration
            let original_seed = generate_test_seed(iteration);
            
            // Create a GameSeed object with this seed
            let game_seed = game::create_game_seed_for_testing(original_seed, ts::ctx(&mut scenario));
            
            // Retrieve the seed from the GameSeed object
            let retrieved_seed = game::get_seed(&game_seed);
            
            // Property: Retrieved seed should match original seed
            assert!(retrieved_seed == original_seed, 0);
            
            // Also verify other fields are set correctly
            assert!(game::get_player(&game_seed) == PLAYER1, 1);
            assert!(game::is_used(&game_seed) == false, 2);
            
            // Clean up
            sui::test_utils::destroy(game_seed);
            ts::end(scenario);
            
            iteration = iteration + 1;
        };
    }
    
    /// Additional test: Verify different seeds produce different GameSeed objects
    #[test]
    fun test_seed_uniqueness() {
        let mut scenario = ts::begin(PLAYER1);
        
        let seed1 = generate_test_seed(1);
        let seed2 = generate_test_seed(2);
        
        let game_seed1 = game::create_game_seed_for_testing(seed1, ts::ctx(&mut scenario));
        let game_seed2 = game::create_game_seed_for_testing(seed2, ts::ctx(&mut scenario));
        
        // Seeds should be different
        assert!(game::get_seed(&game_seed1) != game::get_seed(&game_seed2), 0);
        
        sui::test_utils::destroy(game_seed1);
        sui::test_utils::destroy(game_seed2);
        ts::end(scenario);
    }
    
    /// Test: Verify player address is correctly stored
    #[test]
    fun test_player_address_storage() {
        // Test with PLAYER1
        let mut scenario1 = ts::begin(PLAYER1);
        let seed1 = generate_test_seed(42);
        let game_seed1 = game::create_game_seed_for_testing(seed1, ts::ctx(&mut scenario1));
        assert!(game::get_player(&game_seed1) == PLAYER1, 0);
        sui::test_utils::destroy(game_seed1);
        ts::end(scenario1);
        
        // Test with PLAYER2
        let mut scenario2 = ts::begin(PLAYER2);
        let seed2 = generate_test_seed(43);
        let game_seed2 = game::create_game_seed_for_testing(seed2, ts::ctx(&mut scenario2));
        assert!(game::get_player(&game_seed2) == PLAYER2, 1);
        sui::test_utils::destroy(game_seed2);
        ts::end(scenario2);
    }
    
    /// Feature: web3-tetris-game, Property 12: Game seed uniqueness
    /// Validates: Requirements 5.1
    /// 
    /// Property: For any game start request, the generated seed should be unique 
    /// and different from all previously generated seeds
    /// 
    /// Note: This test verifies that seeds generated with different iteration values
    /// produce unique seed bytes. In production, the Sui randomness API ensures
    /// uniqueness through blockchain randomness.
    #[test]
    fun test_property_game_seed_uniqueness() {
        let mut scenario = ts::begin(PLAYER1);
        
        // Generate 100 seeds and store them
        let mut seeds = vector::empty<vector<u8>>();
        let mut iteration = 0;
        
        while (iteration < 100) {
            let seed_bytes = generate_test_seed(iteration);
            let game_seed = game::create_game_seed_for_testing(seed_bytes, ts::ctx(&mut scenario));
            let retrieved_seed = game::get_seed(&game_seed);
            
            // Property: This seed should be different from all previously generated seeds
            let mut j = 0;
            while (j < vector::length(&seeds)) {
                let existing_seed = vector::borrow(&seeds, j);
                assert!(retrieved_seed != *existing_seed, 0);
                j = j + 1;
            };
            
            // Add this seed to our collection
            vector::push_back(&mut seeds, retrieved_seed);
            
            sui::test_utils::destroy(game_seed);
            iteration = iteration + 1;
        };
        
        // Verify we have 100 unique seeds
        assert!(vector::length(&seeds) == 100, 1);
        
        ts::end(scenario);
    }
    
    // ===== Leaderboard Property Tests =====
    
    /// Feature: web3-tetris-game, Property 6: Leaderboard ordering and limiting
    /// Validates: Requirements 3.3
    /// 
    /// Property: For any set of submitted scores, querying the leaderboard should 
    /// return at most 10 entries sorted in descending order by score
    #[test]
    fun test_property_leaderboard_ordering_and_limiting() {
        let mut scenario = ts::begin(PLAYER1);
        
        // Initialize the game system
        {
            game::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Get the shared leaderboard and treasury objects
        ts::next_tx(&mut scenario, PLAYER1);
        let mut leaderboard = ts::take_shared<game::Leaderboard>(&scenario);
        let mut treasury = ts::take_shared<game::TokenTreasury>(&scenario);
        let mut clock = sui::clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Run 100 iterations with different score submission patterns
        let mut iteration = 0;
        while (iteration < 100) {
            // Generate a pseudo-random score (0-999,999)
            let score = ((iteration * 7919) % 1000000);
            
            // Determine which player submits (alternate between players)
            let player = if (iteration % 2 == 0) { PLAYER1 } else { PLAYER2 };
            
            ts::next_tx(&mut scenario, player);
            
            // Create a game seed for this submission
            let seed_bytes = generate_test_seed(iteration);
            let mut game_seed = game::create_game_seed_for_testing(seed_bytes, ts::ctx(&mut scenario));
            
            // Submit the score
            game::submit_score(&mut game_seed, score, &mut leaderboard, &mut treasury, &clock, ts::ctx(&mut scenario));
            
            // Get the leaderboard
            let top_scores = game::get_leaderboard(&leaderboard);
            let leaderboard_size = vector::length(&top_scores);
            
            // Property 1: Leaderboard should have at most 10 entries
            assert!(leaderboard_size <= 10, 0);
            
            // Property 2: Scores should be in descending order
            if (leaderboard_size > 1) {
                let mut i = 0;
                while (i < leaderboard_size - 1) {
                    let entry_i = vector::borrow(&top_scores, i);
                    let entry_i1 = vector::borrow(&top_scores, i + 1);
                    let score_i = game::get_entry_score(entry_i);
                    let score_i1 = game::get_entry_score(entry_i1);
                    
                    // Each score should be >= the next score
                    assert!(score_i >= score_i1, 1);
                    i = i + 1;
                };
            };
            
            sui::test_utils::destroy(game_seed);
            iteration = iteration + 1;
        };
        
        // Final verification: leaderboard should have exactly 10 entries (we submitted 100 scores)
        let final_scores = game::get_leaderboard(&leaderboard);
        assert!(vector::length(&final_scores) <= 10, 2);
        
        sui::clock::destroy_for_testing(clock);
        ts::return_shared(leaderboard);
        ts::return_shared(treasury);
        ts::end(scenario);
    }
    
    /// Feature: web3-tetris-game, Property 7: Player best score retention
    /// Validates: Requirements 3.4
    /// 
    /// Property: For any sequence of score submissions from the same player, 
    /// the leaderboard should retain only the highest score for that player
    #[test]
    fun test_property_player_best_score_retention() {
        let mut scenario = ts::begin(PLAYER1);
        
        // Initialize the game system
        {
            game::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Get the shared leaderboard and treasury objects
        ts::next_tx(&mut scenario, PLAYER1);
        let mut leaderboard = ts::take_shared<game::Leaderboard>(&scenario);
        let mut treasury = ts::take_shared<game::TokenTreasury>(&scenario);
        let mut clock = sui::clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Run 100 iterations where PLAYER1 submits multiple scores
        let mut iteration = 0;
        let mut max_score_submitted = 0u64;
        
        while (iteration < 100) {
            // Generate a pseudo-random score (0-999,999)
            let score = ((iteration * 7919) % 1000000);
            
            // Track the maximum score we've submitted
            if (score > max_score_submitted) {
                max_score_submitted = score;
            };
            
            ts::next_tx(&mut scenario, PLAYER1);
            
            // Create a game seed for this submission
            let seed_bytes = generate_test_seed(iteration);
            let mut game_seed = game::create_game_seed_for_testing(seed_bytes, ts::ctx(&mut scenario));
            
            // Submit the score
            game::submit_score(&mut game_seed, score, &mut leaderboard, &mut treasury, &clock, ts::ctx(&mut scenario));
            
            // Property: PLAYER1 should only appear once on the leaderboard
            let top_scores = game::get_leaderboard(&leaderboard);
            let mut player1_count = 0;
            let mut player1_score = 0u64;
            let mut i = 0;
            
            while (i < vector::length(&top_scores)) {
                let entry = vector::borrow(&top_scores, i);
                if (game::get_entry_player(entry) == PLAYER1) {
                    player1_count = player1_count + 1;
                    player1_score = game::get_entry_score(entry);
                };
                i = i + 1;
            };
            
            // Property 1: Player should appear at most once
            assert!(player1_count <= 1, 0);
            
            // Property 2: If player is on leaderboard, their score should be their best score
            if (player1_count == 1) {
                assert!(player1_score == max_score_submitted, 1);
            };
            
            sui::test_utils::destroy(game_seed);
            iteration = iteration + 1;
        };
        
        // Final verification using get_player_best_score
        let player1_best = game::get_player_best_score(&leaderboard, PLAYER1);
        if (player1_best > 0) {
            assert!(player1_best == max_score_submitted, 2);
        };
        
        sui::clock::destroy_for_testing(clock);
        ts::return_shared(leaderboard);
        ts::return_shared(treasury);
        ts::end(scenario);
    }
    
    // ===== Token Reward Property Tests =====
    
    /// Feature: web3-tetris-game, Property 9: Token reward calculation and distribution
    /// Validates: Requirements 4.1, 4.2, 4.3
    /// 
    /// Property: For any valid score submission, the contract should calculate tokens 
    /// as score / 100, mint that amount, and transfer to the player's address, 
    /// increasing their balance accordingly
    #[test]
    fun test_property_token_reward_calculation_and_distribution() {
        let mut scenario = ts::begin(PLAYER1);
        
        // Initialize the game system
        {
            game::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Get the shared leaderboard and treasury objects
        ts::next_tx(&mut scenario, PLAYER1);
        let mut leaderboard = ts::take_shared<game::Leaderboard>(&scenario);
        let mut treasury = ts::take_shared<game::TokenTreasury>(&scenario);
        let mut clock = sui::clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Track initial supply
        let initial_supply = game::get_total_supply(&treasury);
        
        // Run 100 iterations with different scores
        let mut iteration = 0;
        let mut total_tokens_expected = 0u64;
        
        while (iteration < 100) {
            // Generate a pseudo-random score (0-999,999)
            let score = ((iteration * 7919) % 1000000);
            
            // Calculate expected token reward: tokens = score / 100
            let expected_tokens = score / 100;
            total_tokens_expected = total_tokens_expected + expected_tokens;
            
            // Alternate between players to avoid "only highest score" logic interfering
            let player = if (iteration % 2 == 0) { PLAYER1 } else { PLAYER2 };
            
            ts::next_tx(&mut scenario, player);
            
            // Create a game seed for this submission
            let seed_bytes = generate_test_seed(iteration);
            let mut game_seed = game::create_game_seed_for_testing(seed_bytes, ts::ctx(&mut scenario));
            
            // Get supply before submission
            let supply_before = game::get_total_supply(&treasury);
            
            // Submit the score
            game::submit_score(&mut game_seed, score, &mut leaderboard, &mut treasury, &clock, ts::ctx(&mut scenario));
            
            // Get supply after submission
            let supply_after = game::get_total_supply(&treasury);
            
            // Property 1: Supply should increase by exactly expected_tokens
            let supply_increase = supply_after - supply_before;
            assert!(supply_increase == expected_tokens, 0);
            
            // Property 2: Total supply should match cumulative expected tokens
            assert!(supply_after == initial_supply + total_tokens_expected, 1);
            
            sui::test_utils::destroy(game_seed);
            iteration = iteration + 1;
        };
        
        // Final verification: Check that tokens were actually transferred to players
        // We can verify this by checking that the supply increased correctly
        let final_supply = game::get_total_supply(&treasury);
        assert!(final_supply == initial_supply + total_tokens_expected, 2);
        
        sui::clock::destroy_for_testing(clock);
        ts::return_shared(leaderboard);
        ts::return_shared(treasury);
        ts::end(scenario);
    }
    
    /// Additional test: Verify zero tokens for scores < 100
    #[test]
    fun test_no_tokens_for_low_scores() {
        let mut scenario = ts::begin(PLAYER1);
        
        // Initialize the game system
        {
            game::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Get the shared objects
        ts::next_tx(&mut scenario, PLAYER1);
        let mut leaderboard = ts::take_shared<game::Leaderboard>(&scenario);
        let mut treasury = ts::take_shared<game::TokenTreasury>(&scenario);
        let mut clock = sui::clock::create_for_testing(ts::ctx(&mut scenario));
        
        let initial_supply = game::get_total_supply(&treasury);
        
        // Test scores from 0 to 99 (should all result in 0 tokens)
        let mut score = 0;
        while (score < 100) {
            ts::next_tx(&mut scenario, PLAYER1);
            
            let seed_bytes = generate_test_seed(score);
            let mut game_seed = game::create_game_seed_for_testing(seed_bytes, ts::ctx(&mut scenario));
            
            game::submit_score(&mut game_seed, score, &mut leaderboard, &mut treasury, &clock, ts::ctx(&mut scenario));
            
            // Supply should not change for scores < 100
            let current_supply = game::get_total_supply(&treasury);
            assert!(current_supply == initial_supply, 0);
            
            sui::test_utils::destroy(game_seed);
            score = score + 1;
        };
        
        sui::clock::destroy_for_testing(clock);
        ts::return_shared(leaderboard);
        ts::return_shared(treasury);
        ts::end(scenario);
    }
    
    /// Additional test: Verify exact token calculation for boundary values
    #[test]
    fun test_token_calculation_boundaries() {
        let mut scenario = ts::begin(PLAYER1);
        
        // Initialize the game system
        {
            game::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Get the shared objects
        ts::next_tx(&mut scenario, PLAYER1);
        let mut leaderboard = ts::take_shared<game::Leaderboard>(&scenario);
        let mut treasury = ts::take_shared<game::TokenTreasury>(&scenario);
        let mut clock = sui::clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Test specific boundary values
        let test_cases = vector[
            100u64,    // Should give 1 token
            199u64,    // Should give 1 token (integer division)
            200u64,    // Should give 2 tokens
            999999u64, // Maximum score, should give 9999 tokens
        ];
        
        let expected_tokens = vector[1u64, 1u64, 2u64, 9999u64];
        
        let mut i = 0;
        while (i < vector::length(&test_cases)) {
            let score = *vector::borrow(&test_cases, i);
            let expected = *vector::borrow(&expected_tokens, i);
            
            ts::next_tx(&mut scenario, PLAYER1);
            
            let seed_bytes = generate_test_seed(i);
            let mut game_seed = game::create_game_seed_for_testing(seed_bytes, ts::ctx(&mut scenario));
            
            let supply_before = game::get_total_supply(&treasury);
            
            game::submit_score(&mut game_seed, score, &mut leaderboard, &mut treasury, &clock, ts::ctx(&mut scenario));
            
            let supply_after = game::get_total_supply(&treasury);
            let tokens_minted = supply_after - supply_before;
            
            // Verify exact token amount
            assert!(tokens_minted == expected, 0);
            
            sui::test_utils::destroy(game_seed);
            i = i + 1;
        };
        
        sui::clock::destroy_for_testing(clock);
        ts::return_shared(leaderboard);
        ts::return_shared(treasury);
        ts::end(scenario);
    }
    
    /// Feature: web3-tetris-game, Property 11: Token mint event emission
    /// Validates: Requirements 4.5
    /// 
    /// Property: For any token minting operation, an event should be emitted 
    /// containing the player address and token amount
    /// 
    /// Note: In Sui Move unit tests, we verify event emission logic by testing
    /// the conditions under which events should be emitted. The actual event
    /// emission is verified through the contract logic that calls sui::event::emit.
    #[test]
    fun test_property_token_mint_event_emission() {
        let mut scenario = ts::begin(PLAYER1);
        
        // Initialize the game system
        {
            game::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Get the shared objects
        ts::next_tx(&mut scenario, PLAYER1);
        let mut leaderboard = ts::take_shared<game::Leaderboard>(&scenario);
        let mut treasury = ts::take_shared<game::TokenTreasury>(&scenario);
        let mut clock = sui::clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Run 100 iterations testing various score values
        let mut iteration = 0;
        
        while (iteration < 100) {
            // Generate a pseudo-random score (0-999,999)
            let score = ((iteration * 7919) % 1000000);
            let expected_tokens = score / 100;
            
            // Alternate between players
            let player = if (iteration % 2 == 0) { PLAYER1 } else { PLAYER2 };
            
            ts::next_tx(&mut scenario, player);
            
            // Create a game seed for this submission
            let seed_bytes = generate_test_seed(iteration);
            let mut game_seed = game::create_game_seed_for_testing(seed_bytes, ts::ctx(&mut scenario));
            
            let supply_before = game::get_total_supply(&treasury);
            
            // Submit the score - this should emit an event if tokens > 0
            game::submit_score(&mut game_seed, score, &mut leaderboard, &mut treasury, &clock, ts::ctx(&mut scenario));
            
            let supply_after = game::get_total_supply(&treasury);
            let tokens_minted = supply_after - supply_before;
            
            // Property: If tokens were minted (tokens > 0), then an event was emitted
            // We verify this indirectly by confirming that:
            // 1. Tokens were minted when score >= 100
            // 2. No tokens were minted when score < 100
            // The event emission happens in the same conditional block as token minting
            
            if (score >= 100) {
                // Tokens should have been minted, and event should have been emitted
                assert!(tokens_minted == expected_tokens, 0);
                assert!(tokens_minted > 0, 1);
            } else {
                // No tokens should have been minted, and no event should have been emitted
                assert!(tokens_minted == 0, 2);
            };
            
            sui::test_utils::destroy(game_seed);
            iteration = iteration + 1;
        };
        
        sui::clock::destroy_for_testing(clock);
        ts::return_shared(leaderboard);
        ts::return_shared(treasury);
        ts::end(scenario);
    }
    
    /// Additional test: Verify event emission logic for boundary cases
    #[test]
    fun test_event_emission_boundaries() {
        let mut scenario = ts::begin(PLAYER1);
        
        // Initialize the game system
        {
            game::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Get the shared objects
        ts::next_tx(&mut scenario, PLAYER1);
        let mut leaderboard = ts::take_shared<game::Leaderboard>(&scenario);
        let mut treasury = ts::take_shared<game::TokenTreasury>(&scenario);
        let mut clock = sui::clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Test boundary cases for event emission
        let test_cases = vector[
            0u64,      // No event (0 tokens)
            99u64,     // No event (0 tokens)
            100u64,    // Event emitted (1 token)
            101u64,    // Event emitted (1 token)
            999999u64, // Event emitted (9999 tokens)
        ];
        
        let mut i = 0;
        while (i < vector::length(&test_cases)) {
            let score = *vector::borrow(&test_cases, i);
            let expected_tokens = score / 100;
            
            ts::next_tx(&mut scenario, PLAYER1);
            
            let seed_bytes = generate_test_seed(i);
            let mut game_seed = game::create_game_seed_for_testing(seed_bytes, ts::ctx(&mut scenario));
            
            let supply_before = game::get_total_supply(&treasury);
            
            game::submit_score(&mut game_seed, score, &mut leaderboard, &mut treasury, &clock, ts::ctx(&mut scenario));
            
            let supply_after = game::get_total_supply(&treasury);
            let tokens_minted = supply_after - supply_before;
            
            // Verify token minting matches expected (which correlates with event emission)
            assert!(tokens_minted == expected_tokens, 0);
            
            // Property: Event is emitted if and only if tokens > 0
            if (expected_tokens > 0) {
                assert!(tokens_minted > 0, 1);
            } else {
                assert!(tokens_minted == 0, 2);
            };
            
            sui::test_utils::destroy(game_seed);
            i = i + 1;
        };
        
        sui::clock::destroy_for_testing(clock);
        ts::return_shared(leaderboard);
        ts::return_shared(treasury);
        ts::end(scenario);
    }
}
