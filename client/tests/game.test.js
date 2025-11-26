/**
 * Property-based tests for TetrisGame
 * Using fast-check for property-based testing
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { TetrisGame, PIECE_TYPES, GRID_WIDTH, GRID_HEIGHT, Piece } from '../src/game.js';
import { PieceGenerator } from '../src/random.js';

describe('TetrisGame Property Tests', () => {
    
    // Feature: web3-tetris-game, Property 1: Piece spawn position consistency
    // Validates: Requirements 1.2
    test('Property 1: Piece spawn position consistency - pieces spawn at top center', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 7 }), // piece type
                (pieceType) => {
                    const game = new TetrisGame();
                    const piece = game.spawnPiece(pieceType);
                    
                    // If spawn was successful (not game over)
                    if (piece !== null) {
                        // Piece should spawn at x = 3 (top center)
                        expect(piece.x).toBe(3);
                        // Piece should spawn at y = 0 (top)
                        expect(piece.y).toBe(0);
                        // Piece should have correct type
                        expect(piece.type).toBe(pieceType);
                        // Piece should start at rotation 0
                        expect(piece.rotation).toBe(0);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: web3-tetris-game, Property 2: Game mechanics correctness
    // Validates: Requirements 1.3, 1.4, 1.5
    test('Property 2: Game mechanics correctness - pieces move/rotate correctly, lock when needed, lines clear', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 7 }), // piece type
                fc.array(fc.constantFrom('ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'), { minLength: 1, maxLength: 20 }), // sequence of inputs
                (pieceType, inputs) => {
                    const game = new TetrisGame();
                    game.start();
                    
                    // Spawn a specific piece
                    game.currentPiece = game.spawnPiece(pieceType);
                    
                    if (game.currentPiece === null) {
                        // Spawn failed, game over
                        return true;
                    }
                    
                    const initialX = game.currentPiece.x;
                    const initialY = game.currentPiece.y;
                    const initialRotation = game.currentPiece.rotation;
                    
                    // Apply inputs
                    for (const input of inputs) {
                        if (game.isGameOver) break;
                        
                        const beforeX = game.currentPiece.x;
                        const beforeY = game.currentPiece.y;
                        const beforeRotation = game.currentPiece.rotation;
                        
                        const moved = game.handleInput(input);
                        
                        if (moved) {
                            // Verify movement was valid
                            switch (input) {
                                case 'ArrowLeft':
                                    // Should move left or stay same
                                    expect(game.currentPiece.x).toBeLessThanOrEqual(beforeX);
                                    break;
                                case 'ArrowRight':
                                    // Should move right or stay same
                                    expect(game.currentPiece.x).toBeGreaterThanOrEqual(beforeX);
                                    break;
                                case 'ArrowDown':
                                    // Should move down
                                    expect(game.currentPiece.y).toBeGreaterThan(beforeY);
                                    break;
                                case 'ArrowUp':
                                    // Should rotate (rotation changes)
                                    expect(game.currentPiece.rotation).not.toBe(beforeRotation);
                                    break;
                            }
                            
                            // After valid move, piece should not collide
                            expect(game.checkCollision(game.currentPiece, 0, 0)).toBe(false);
                        }
                    }
                    
                    // Test piece locking
                    const pieceBeforeLock = game.currentPiece ? game.currentPiece.clone() : null;
                    
                    if (pieceBeforeLock) {
                        // Move piece down until it can't move anymore
                        while (game.moveDown()) {
                            // Keep moving down
                        }
                        
                        // Now piece should be at bottom or blocked
                        expect(game.checkCollision(game.currentPiece, 0, 1)).toBe(true);
                        
                        // Lock the piece
                        game.lockPiece();
                        
                        // Verify piece is now in grid
                        const shape = pieceBeforeLock.getShape();
                        let foundLockedPiece = false;
                        for (let y = 0; y < 4; y++) {
                            for (let x = 0; x < 4; x++) {
                                if (shape[y][x]) {
                                    const gridX = game.currentPiece.x + x;
                                    const gridY = game.currentPiece.y + y;
                                    if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                                        if (game.grid[gridY][gridX] !== 0) {
                                            foundLockedPiece = true;
                                        }
                                    }
                                }
                            }
                        }
                        expect(foundLockedPiece).toBe(true);
                    }
                    
                    // Test line clearing
                    // Create a complete line at the bottom
                    for (let x = 0; x < GRID_WIDTH; x++) {
                        game.grid[GRID_HEIGHT - 1][x] = 1;
                    }
                    
                    // Count filled cells before clearing
                    let filledCellsBefore = 0;
                    for (let y = 0; y < GRID_HEIGHT; y++) {
                        for (let x = 0; x < GRID_WIDTH; x++) {
                            if (game.grid[y][x] !== 0) {
                                filledCellsBefore++;
                            }
                        }
                    }
                    
                    const cleared = game.clearLines();
                    
                    // Should have cleared 1 line
                    expect(cleared).toBe(1);
                    
                    // Count filled cells after clearing
                    let filledCellsAfter = 0;
                    for (let y = 0; y < GRID_HEIGHT; y++) {
                        for (let x = 0; x < GRID_WIDTH; x++) {
                            if (game.grid[y][x] !== 0) {
                                filledCellsAfter++;
                            }
                        }
                    }
                    
                    // Should have 10 fewer filled cells (one complete line removed)
                    expect(filledCellsAfter).toBe(filledCellsBefore - GRID_WIDTH);
                    
                    // Top line should be empty (new line added at top)
                    let topLineEmpty = true;
                    for (let x = 0; x < GRID_WIDTH; x++) {
                        if (game.grid[0][x] !== 0) {
                            topLineEmpty = false;
                        }
                    }
                    expect(topLineEmpty).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: web3-tetris-game, Property 3: Game over detection
    // Validates: Requirements 1.6
    test('Property 3: Game over detection - game ends when pieces stack to top', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: GRID_WIDTH - 1 }), // x position
                fc.integer({ min: 1, max: 7 }), // piece type
                (xPos, pieceType) => {
                    const game = new TetrisGame();
                    game.start();
                    
                    // Fill the grid up to the top row (y = 0)
                    // Leave the top row empty initially
                    for (let y = 1; y < GRID_HEIGHT; y++) {
                        for (let x = 0; x < GRID_WIDTH; x++) {
                            game.grid[y][x] = 1;
                        }
                    }
                    
                    // Game should not be over yet (top row is empty)
                    expect(game.checkGameOver()).toBe(false);
                    expect(game.isGameOver).toBe(false);
                    
                    // Now fill at least one cell in the top row (y = 0)
                    game.grid[0][xPos] = pieceType;
                    
                    // Check game over
                    const isOver = game.checkGameOver();
                    
                    // Game should be over now
                    expect(isOver).toBe(true);
                    expect(game.isGameOver).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: spawning a piece when top is blocked should trigger game over
    test('Property 3b: Game over on spawn collision', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 7 }), // piece type
                (pieceType) => {
                    const game = new TetrisGame();
                    game.start();
                    
                    // Block the entire spawn area more thoroughly
                    // Pieces spawn at x=3, y=0 and occupy a 4x4 area
                    // Block rows 0-3, columns 2-6 to ensure collision
                    for (let y = 0; y < 4; y++) {
                        for (let x = 2; x < 7; x++) {
                            game.grid[y][x] = 1;
                        }
                    }
                    
                    // Try to spawn a piece
                    const piece = game.spawnPiece(pieceType);
                    
                    // Spawn should fail and return null
                    expect(piece).toBe(null);
                    
                    // Game should be over
                    expect(game.isGameOver).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});


describe('GameUI Property Tests', () => {
    
    // Feature: web3-tetris-game, Property 18: Real-time score updates
    // Validates: Requirements 7.2
    test('Property 18: Real-time score updates - score display updates when game state changes', async () => {
        // Set up DOM environment for testing
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        // Mock canvas getContext for JSDOM
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        // Import GameUI after setting up DOM
        const { GameUI } = await import('../src/ui.js');
        
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 999999 }), // score
                fc.integer({ min: 0, max: 1000 }), // lines cleared
                fc.integer({ min: 1, max: 100 }), // level
                (score, lines, level) => {
                    const ui = new GameUI();
                    
                    // Get the DOM elements
                    const scoreElement = document.getElementById('score');
                    const linesElement = document.getElementById('lines');
                    const levelElement = document.getElementById('level');
                    
                    // Update the score display
                    ui.updateScoreDisplay(score, lines, level);
                    
                    // Verify the display was updated correctly
                    expect(scoreElement.textContent).toBe(score.toString());
                    expect(linesElement.textContent).toBe(lines.toString());
                    expect(levelElement.textContent).toBe(level.toString());
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('BlockchainInterface Property Tests', () => {
    
    // Feature: web3-tetris-game, Property 4: Wallet state transitions
    // Validates: Requirements 2.3, 2.4, 2.5
    test('Property 4: Wallet state transitions - UI reflects correct state on connect/disconnect/error', async () => {
        // Set up DOM environment for testing
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                    <div id="walletConnected" class="hidden"></div>
                    <div id="walletDisconnected"></div>
                    <span id="walletAddress">Not connected</span>
                    <span id="tokenBalance">0 GAME</span>
                    <div id="leaderboardList"></div>
                    <button id="submitScoreBtn"></button>
                    <button id="refreshBalanceBtn"></button>
                    <button id="refreshLeaderboardBtn"></button>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        // Mock canvas getContext for JSDOM
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        // Import modules after setting up DOM
        const { BlockchainInterface } = await import('../src/blockchain.js');
        const { GameUI } = await import('../src/ui.js');
        
        fc.assert(
            fc.property(
                fc.constantFrom('connect_success', 'connect_fail', 'disconnect'), // state transition type
                fc.hexaString({ minLength: 64, maxLength: 64 }), // mock address
                (transitionType, mockAddress) => {
                    const blockchain = new BlockchainInterface();
                    const ui = new GameUI();
                    
                    // Get UI elements
                    const walletConnected = document.getElementById('walletConnected');
                    const walletDisconnected = document.getElementById('walletDisconnected');
                    const walletAddress = document.getElementById('walletAddress');
                    const submitScoreBtn = document.getElementById('submitScoreBtn');
                    const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');
                    const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');
                    const leaderboardList = document.getElementById('leaderboardList');
                    const tokenBalance = document.getElementById('tokenBalance');
                    
                    // Test different state transitions
                    if (transitionType === 'connect_success') {
                        // Simulate successful connection
                        const address = '0x' + mockAddress;
                        
                        // Manually set blockchain state (simulating successful connection)
                        blockchain.playerAddress = address;
                        blockchain.isConnected = true;
                        
                        // Update UI to reflect connected state
                        ui.renderWalletStatus(address);
                        
                        // Verify UI shows connected state
                        expect(walletConnected.classList.contains('hidden')).toBe(false);
                        expect(walletDisconnected.classList.contains('hidden')).toBe(true);
                        expect(walletAddress.textContent).toBe(address);
                        
                        // Verify blockchain state
                        expect(blockchain.isWalletConnected()).toBe(true);
                        expect(blockchain.getPlayerAddress()).toBe(address);
                        
                    } else if (transitionType === 'connect_fail') {
                        // Simulate failed connection
                        
                        // Blockchain should remain disconnected
                        expect(blockchain.isWalletConnected()).toBe(false);
                        expect(blockchain.getPlayerAddress()).toBe(null);
                        
                        // UI should show disconnected state
                        ui.renderWalletStatus(null);
                        expect(walletConnected.classList.contains('hidden')).toBe(true);
                        expect(walletDisconnected.classList.contains('hidden')).toBe(false);
                        
                    } else if (transitionType === 'disconnect') {
                        // First connect
                        const address = '0x' + mockAddress;
                        blockchain.playerAddress = address;
                        blockchain.isConnected = true;
                        ui.renderWalletStatus(address);
                        
                        // Verify connected
                        expect(blockchain.isWalletConnected()).toBe(true);
                        
                        // Now disconnect
                        blockchain.playerAddress = null;
                        blockchain.isConnected = false;
                        ui.renderWalletStatus(null);
                        
                        // Verify disconnected state
                        expect(blockchain.isWalletConnected()).toBe(false);
                        expect(blockchain.getPlayerAddress()).toBe(null);
                        expect(walletConnected.classList.contains('hidden')).toBe(true);
                        expect(walletDisconnected.classList.contains('hidden')).toBe(false);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Wallet detection
    test('Property 4b: Wallet detection works correctly', async () => {
        const { BlockchainInterface } = await import('../src/blockchain.js');
        
        fc.assert(
            fc.property(
                fc.boolean(), // whether wallet is installed
                (isInstalled) => {
                    const blockchain = new BlockchainInterface();
                    
                    // Mock window.suiWallet
                    if (isInstalled) {
                        global.window.suiWallet = { requestPermissions: async () => [] };
                    } else {
                        delete global.window.suiWallet;
                    }
                    
                    // Check wallet detection
                    const detected = blockchain.isWalletInstalled();
                    expect(detected).toBe(isInstalled);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: State consistency
    test('Property 4c: Blockchain state remains consistent', async () => {
        const { BlockchainInterface } = await import('../src/blockchain.js');
        
        fc.assert(
            fc.property(
                fc.hexaString({ minLength: 64, maxLength: 64 }), // address
                (mockAddress) => {
                    const blockchain = new BlockchainInterface();
                    const address = '0x' + mockAddress;
                    
                    // Initially disconnected
                    expect(blockchain.isWalletConnected()).toBe(false);
                    expect(blockchain.getPlayerAddress()).toBe(null);
                    
                    // Simulate connection
                    blockchain.playerAddress = address;
                    blockchain.isConnected = true;
                    
                    // Should be connected
                    expect(blockchain.isWalletConnected()).toBe(true);
                    expect(blockchain.getPlayerAddress()).toBe(address);
                    
                    // Simulate disconnection
                    blockchain.playerAddress = null;
                    blockchain.isConnected = false;
                    
                    // Should be disconnected again
                    expect(blockchain.isWalletConnected()).toBe(false);
                    expect(blockchain.getPlayerAddress()).toBe(null);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Score Submission Property Tests', () => {
    
    // Feature: web3-tetris-game, Property 5: Score submission acceptance
    // Validates: Requirements 3.1, 3.2
    test('Property 5: Score submission acceptance - valid scores with unused seeds are accepted', async () => {
        const { BlockchainInterface } = await import('../src/blockchain.js');
        
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 0, max: 999999 }), // valid score range
                fc.hexaString({ minLength: 64, maxLength: 64 }), // game seed object ID
                fc.hexaString({ minLength: 64, maxLength: 64 }), // player address
                async (score, seedId, playerAddr) => {
                    const blockchain = new BlockchainInterface();
                    const gameSeedObjectId = '0x' + seedId;
                    const playerAddress = '0x' + playerAddr;
                    
                    // Simulate connected wallet
                    blockchain.playerAddress = playerAddress;
                    blockchain.isConnected = true;
                    
                    // Mock the wallet's signAndExecuteTransactionBlock method
                    const mockWallet = {
                        signAndExecuteTransactionBlock: async (params) => {
                            // Verify transaction was built correctly
                            expect(params.transactionBlock).toBeDefined();
                            expect(params.options).toBeDefined();
                            expect(params.options.showEffects).toBe(true);
                            expect(params.options.showEvents).toBe(true);
                            
                            // Return a successful transaction result
                            return {
                                digest: '0xmocktxdigest',
                                effects: {
                                    status: {
                                        status: 'success'
                                    }
                                },
                                events: [
                                    {
                                        type: `${playerAddress}::game::TokenMintEvent`,
                                        parsedJson: {
                                            player: playerAddress,
                                            amount: Math.floor(score / 100),
                                            score: score
                                        }
                                    }
                                ]
                            };
                        }
                    };
                    
                    blockchain.wallet = mockWallet;
                    
                    // Submit the score
                    const result = await blockchain.submitScore(gameSeedObjectId, score);
                    
                    // Verify the result
                    expect(result.success).toBe(true);
                    expect(result.tokensEarned).toBe(Math.floor(score / 100));
                    expect(result.txDigest).toBeDefined();
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Invalid scores should be rejected
    test('Property 5b: Score validation - invalid scores are rejected', async () => {
        const { BlockchainInterface } = await import('../src/blockchain.js');
        
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1000000, max: 10000000 }), // invalid score (too high)
                fc.hexaString({ minLength: 64, maxLength: 64 }), // game seed object ID
                fc.hexaString({ minLength: 64, maxLength: 64 }), // player address
                async (invalidScore, seedId, playerAddr) => {
                    const blockchain = new BlockchainInterface();
                    const gameSeedObjectId = '0x' + seedId;
                    const playerAddress = '0x' + playerAddr;
                    
                    // Simulate connected wallet
                    blockchain.playerAddress = playerAddress;
                    blockchain.isConnected = true;
                    blockchain.wallet = {}; // Mock wallet
                    
                    // Submit invalid score
                    const result = await blockchain.submitScore(gameSeedObjectId, invalidScore);
                    
                    // Should fail with validation error
                    expect(result.success).toBe(false);
                    expect(result.error).toBeDefined();
                    expect(result.error).toContain('Invalid score');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Negative scores should be rejected
    test('Property 5c: Score validation - negative scores are rejected', async () => {
        const { BlockchainInterface } = await import('../src/blockchain.js');
        
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: -1000000, max: -1 }), // negative score
                fc.hexaString({ minLength: 64, maxLength: 64 }), // game seed object ID
                fc.hexaString({ minLength: 64, maxLength: 64 }), // player address
                async (negativeScore, seedId, playerAddr) => {
                    const blockchain = new BlockchainInterface();
                    const gameSeedObjectId = '0x' + seedId;
                    const playerAddress = '0x' + playerAddr;
                    
                    // Simulate connected wallet
                    blockchain.playerAddress = playerAddress;
                    blockchain.isConnected = true;
                    blockchain.wallet = {}; // Mock wallet
                    
                    // Submit negative score
                    const result = await blockchain.submitScore(gameSeedObjectId, negativeScore);
                    
                    // Should fail with validation error
                    expect(result.success).toBe(false);
                    expect(result.error).toBeDefined();
                    expect(result.error).toContain('Invalid score');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Disconnected wallet should be rejected
    test('Property 5d: Wallet connection required - disconnected wallet is rejected', async () => {
        const { BlockchainInterface } = await import('../src/blockchain.js');
        
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 0, max: 999999 }), // valid score
                fc.hexaString({ minLength: 64, maxLength: 64 }), // game seed object ID
                async (score, seedId) => {
                    const blockchain = new BlockchainInterface();
                    const gameSeedObjectId = '0x' + seedId;
                    
                    // Wallet is NOT connected
                    expect(blockchain.isWalletConnected()).toBe(false);
                    
                    // Try to submit score
                    const result = await blockchain.submitScore(gameSeedObjectId, score);
                    
                    // Should fail with wallet connection error
                    expect(result.success).toBe(false);
                    expect(result.error).toBeDefined();
                    expect(result.error).toContain('Wallet not connected');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Token calculation is correct
    test('Property 5e: Token reward calculation - tokens = score / 100', async () => {
        const { BlockchainInterface } = await import('../src/blockchain.js');
        
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 0, max: 999999 }), // valid score
                fc.hexaString({ minLength: 64, maxLength: 64 }), // game seed object ID
                fc.hexaString({ minLength: 64, maxLength: 64 }), // player address
                async (score, seedId, playerAddr) => {
                    const blockchain = new BlockchainInterface();
                    const gameSeedObjectId = '0x' + seedId;
                    const playerAddress = '0x' + playerAddr;
                    
                    // Simulate connected wallet
                    blockchain.playerAddress = playerAddress;
                    blockchain.isConnected = true;
                    
                    // Mock the wallet
                    const mockWallet = {
                        signAndExecuteTransactionBlock: async () => ({
                            digest: '0xmocktxdigest',
                            effects: { status: { status: 'success' } },
                            events: []
                        })
                    };
                    
                    blockchain.wallet = mockWallet;
                    
                    // Submit the score
                    const result = await blockchain.submitScore(gameSeedObjectId, score);
                    
                    // Verify token calculation
                    const expectedTokens = Math.floor(score / 100);
                    expect(result.tokensEarned).toBe(expectedTokens);
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('PieceGenerator Property Tests', () => {
    
    // Feature: web3-tetris-game, Property 14: Deterministic piece generation
    // Validates: Requirements 5.3
    test('Property 14: Deterministic piece generation - same seed produces same sequence', () => {
        fc.assert(
            fc.property(
                fc.uint8Array({ minLength: 32, maxLength: 32 }), // game seed
                (seed) => {
                    // Create two generators with the same seed
                    const gen1 = new PieceGenerator(seed);
                    const gen2 = new PieceGenerator(seed);
                    
                    // Generate 100 pieces from each generator
                    const sequence1 = [];
                    const sequence2 = [];
                    
                    for (let i = 0; i < 100; i++) {
                        sequence1.push(gen1.nextPiece());
                        sequence2.push(gen2.nextPiece());
                    }
                    
                    // Both sequences should be identical
                    expect(sequence1).toEqual(sequence2);
                    
                    // Verify all pieces are valid types (1-7)
                    for (let i = 0; i < 100; i++) {
                        expect(sequence1[i]).toBeGreaterThanOrEqual(1);
                        expect(sequence1[i]).toBeLessThanOrEqual(7);
                        expect(sequence2[i]).toBeGreaterThanOrEqual(1);
                        expect(sequence2[i]).toBeLessThanOrEqual(7);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional test: Different seeds should produce different sequences
    test('Property 14b: Different seeds produce different sequences', () => {
        fc.assert(
            fc.property(
                fc.uint8Array({ minLength: 32, maxLength: 32 }), // seed1
                fc.uint8Array({ minLength: 32, maxLength: 32 }), // seed2
                (seed1, seed2) => {
                    // Skip if seeds are identical
                    if (JSON.stringify(seed1) === JSON.stringify(seed2)) {
                        return true;
                    }
                    
                    const gen1 = new PieceGenerator(seed1);
                    const gen2 = new PieceGenerator(seed2);
                    
                    // Generate sequences
                    const sequence1 = [];
                    const sequence2 = [];
                    
                    for (let i = 0; i < 100; i++) {
                        sequence1.push(gen1.nextPiece());
                        sequence2.push(gen2.nextPiece());
                    }
                    
                    // Different seeds should (very likely) produce different sequences
                    // We check that at least one piece is different
                    let hasDifference = false;
                    for (let i = 0; i < 100; i++) {
                        if (sequence1[i] !== sequence2[i]) {
                            hasDifference = true;
                            break;
                        }
                    }
                    
                    // With 100 pieces and different seeds, it's extremely unlikely
                    // to get the same sequence (probability ~= (1/7)^100)
                    expect(hasDifference).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Test: Reset functionality
    test('Property 14c: Reset restores deterministic sequence', () => {
        fc.assert(
            fc.property(
                fc.uint8Array({ minLength: 32, maxLength: 32 }), // game seed
                (seed) => {
                    const gen = new PieceGenerator(seed);
                    
                    // Generate first sequence
                    const sequence1 = [];
                    for (let i = 0; i < 50; i++) {
                        sequence1.push(gen.nextPiece());
                    }
                    
                    // Reset the generator
                    gen.reset();
                    
                    // Generate second sequence
                    const sequence2 = [];
                    for (let i = 0; i < 50; i++) {
                        sequence2.push(gen.nextPiece());
                    }
                    
                    // Both sequences should be identical
                    expect(sequence1).toEqual(sequence2);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Leaderboard Display Property Tests', () => {
    
    // Feature: web3-tetris-game, Property 8: Leaderboard data completeness
    // Validates: Requirements 3.5
    test('Property 8: Leaderboard data completeness - all entries contain player address, score, and timestamp', async () => {
        // Set up DOM environment for testing
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                    <div id="leaderboardList"></div>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        // Mock canvas getContext for JSDOM
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        // Import GameUI after setting up DOM
        const { GameUI } = await import('../src/ui.js');
        
        await fc.assert(
            fc.asyncProperty(
                // Generate an array of score entries (1-10 entries)
                fc.array(
                    fc.record({
                        player: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => '0x' + h),
                        score: fc.integer({ min: 0, max: 999999 }),
                        timestamp: fc.integer({ min: 1000000000000, max: Date.now() }), // Unix timestamp in ms
                        gameSeedId: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => '0x' + h)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.option(fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => '0x' + h), { nil: null }), // current player address (optional)
                async (scores, currentPlayerAddress) => {
                    const ui = new GameUI();
                    
                    // Render the leaderboard
                    ui.renderLeaderboard(scores, currentPlayerAddress);
                    
                    // Get the leaderboard list element
                    const leaderboardList = document.getElementById('leaderboardList');
                    expect(leaderboardList).toBeDefined();
                    
                    // Get all leaderboard entries
                    const entries = leaderboardList.querySelectorAll('.leaderboard-entry');
                    
                    // Should have the same number of entries as scores
                    expect(entries.length).toBe(scores.length);
                    
                    // Verify each entry contains all required data
                    entries.forEach((entry, index) => {
                        const scoreData = scores[index];
                        
                        // Check for rank
                        const rank = entry.querySelector('.leaderboard-rank');
                        expect(rank).toBeDefined();
                        expect(rank.textContent).toContain(`#${index + 1}`);
                        
                        // Check for player address
                        const player = entry.querySelector('.leaderboard-player');
                        expect(player).toBeDefined();
                        expect(player.textContent).toBeDefined();
                        expect(player.textContent.length).toBeGreaterThan(0);
                        // Should be a shortened version of the address
                        expect(player.textContent).toContain('...');
                        
                        // Check for score
                        const score = entry.querySelector('.leaderboard-score');
                        expect(score).toBeDefined();
                        expect(score.textContent).toBeDefined();
                        // Score should be formatted with commas for readability
                        const displayedScore = score.textContent.replace(/,/g, '');
                        expect(parseInt(displayedScore)).toBe(scoreData.score);
                        
                        // Check for timestamp
                        const timestamp = entry.querySelector('.leaderboard-timestamp');
                        expect(timestamp).toBeDefined();
                        expect(timestamp.textContent).toBeDefined();
                        expect(timestamp.textContent.length).toBeGreaterThan(0);
                        // Timestamp should be formatted (not raw number)
                        expect(timestamp.textContent).not.toBe(scoreData.timestamp.toString());
                        
                        // Check if current player's entry is highlighted
                        if (currentPlayerAddress && scoreData.player === currentPlayerAddress) {
                            expect(entry.classList.contains('highlight')).toBe(true);
                        }
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Empty leaderboard displays appropriate message
    test('Property 8b: Empty leaderboard displays empty state message', async () => {
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                    <div id="leaderboardList"></div>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        const { GameUI } = await import('../src/ui.js');
        
        const ui = new GameUI();
        
        // Render empty leaderboard
        ui.renderLeaderboard([]);
        
        const leaderboardList = document.getElementById('leaderboardList');
        expect(leaderboardList).toBeDefined();
        
        // Should display empty state message
        expect(leaderboardList.innerHTML).toContain('No scores yet');
        
        // Should not have any leaderboard entries
        const entries = leaderboardList.querySelectorAll('.leaderboard-entry');
        expect(entries.length).toBe(0);
    });
    
    // Additional test: Timestamp formatting is human-readable
    test('Property 8c: Timestamp formatting produces human-readable output', async () => {
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        const { GameUI } = await import('../src/ui.js');
        
        fc.assert(
            fc.property(
                fc.integer({ min: 1000000000000, max: Date.now() }), // Unix timestamp in ms
                (timestamp) => {
                    const ui = new GameUI();
                    
                    // Format the timestamp
                    const formatted = ui.formatTimestamp(timestamp);
                    
                    // Should return a non-empty string
                    expect(formatted).toBeDefined();
                    expect(typeof formatted).toBe('string');
                    expect(formatted.length).toBeGreaterThan(0);
                    
                    // Should not be the raw timestamp number
                    expect(formatted).not.toBe(timestamp.toString());
                    
                    // Should be one of the expected formats
                    const validFormats = [
                        'Just now',
                        /^\d+m ago$/,      // "5m ago"
                        /^\d+h ago$/,      // "3h ago"
                        /^\d+d ago$/,      // "2d ago"
                        /^\d{1,2}\/\d{1,2}\/\d{4}$/ // "11/26/2025"
                    ];
                    
                    const matchesFormat = validFormats.some(format => {
                        if (typeof format === 'string') {
                            return formatted === format;
                        } else {
                            return format.test(formatted);
                        }
                    });
                    
                    expect(matchesFormat).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Address formatting shortens long addresses
    test('Property 8d: Address formatting shortens addresses correctly', async () => {
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        const { GameUI } = await import('../src/ui.js');
        
        fc.assert(
            fc.property(
                fc.hexaString({ minLength: 64, maxLength: 64 }), // address
                (hexAddress) => {
                    const ui = new GameUI();
                    const address = '0x' + hexAddress;
                    
                    // Format the address
                    const formatted = ui.formatAddress(address);
                    
                    // Should return a shortened version
                    expect(formatted).toBeDefined();
                    expect(typeof formatted).toBe('string');
                    expect(formatted.length).toBeLessThan(address.length);
                    
                    // Should contain ellipsis
                    expect(formatted).toContain('...');
                    
                    // Should start with first 6 characters
                    expect(formatted.startsWith(address.slice(0, 6))).toBe(true);
                    
                    // Should end with last 4 characters
                    expect(formatted.endsWith(address.slice(-4))).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Token Balance Display Property Tests', () => {
    
    // Feature: web3-tetris-game, Property 10: Token balance display
    // Validates: Requirements 4.4
    test('Property 10: Token balance display - balance is correctly formatted and displayed', async () => {
        // Set up DOM environment for testing
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                    <span id="tokenBalance">0 TETRI</span>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        // Mock canvas getContext for JSDOM
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        // Import GameUI after setting up DOM
        const { GameUI } = await import('../src/ui.js');
        
        await fc.assert(
            fc.asyncProperty(
                fc.float({ min: 0, max: Math.fround(9999.99), noNaN: true }), // token balance
                async (balance) => {
                    const ui = new GameUI();
                    
                    // Get the token balance element
                    const tokenBalanceElement = document.getElementById('tokenBalance');
                    expect(tokenBalanceElement).toBeDefined();
                    
                    // Render the token balance
                    ui.renderTokenBalance(balance);
                    
                    // Verify the balance is displayed correctly
                    const displayedText = tokenBalanceElement.textContent;
                    expect(displayedText).toBeDefined();
                    expect(displayedText).toContain('TETRI');
                    
                    // Extract the numeric part
                    const numericPart = displayedText.replace(' TETRI', '').trim();
                    const displayedBalance = parseFloat(numericPart);
                    
                    // Should be formatted to 2 decimal places
                    expect(numericPart).toMatch(/^\d+\.\d{2}$/);
                    
                    // Should match the input balance (within floating point precision)
                    expect(Math.abs(displayedBalance - balance)).toBeLessThan(0.01);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Zero balance displays correctly
    test('Property 10b: Zero balance displays as 0.00 TETRI', async () => {
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                    <span id="tokenBalance">0 TETRI</span>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        const { GameUI } = await import('../src/ui.js');
        
        const ui = new GameUI();
        
        // Render zero balance
        ui.renderTokenBalance(0);
        
        const tokenBalanceElement = document.getElementById('tokenBalance');
        expect(tokenBalanceElement.textContent).toBe('0.00 TETRI');
    });
    
    // Additional test: Large balances display correctly
    test('Property 10c: Large balances display with proper formatting', async () => {
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                    <span id="tokenBalance">0 TETRI</span>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        const { GameUI } = await import('../src/ui.js');
        
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 10000, max: 999999 }), // large balance
                async (largeBalance) => {
                    const ui = new GameUI();
                    
                    // Render large balance
                    ui.renderTokenBalance(largeBalance);
                    
                    const tokenBalanceElement = document.getElementById('tokenBalance');
                    const displayedText = tokenBalanceElement.textContent;
                    
                    // Should contain TETRI
                    expect(displayedText).toContain('TETRI');
                    
                    // Extract numeric part
                    const numericPart = displayedText.replace(' TETRI', '').trim();
                    const displayedBalance = parseFloat(numericPart);
                    
                    // Should match the input balance
                    expect(displayedBalance).toBe(largeBalance);
                    
                    // Should be formatted to 2 decimal places
                    expect(numericPart).toMatch(/^\d+\.\d{2}$/);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    // Additional test: Balance updates correctly when called multiple times
    test('Property 10d: Balance updates correctly on multiple calls', async () => {
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <span id="score">0</span>
                    <span id="lines">0</span>
                    <span id="level">1</span>
                    <span id="tokenBalance">0 TETRI</span>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        const mockContext = {
            strokeStyle: '',
            lineWidth: 0,
            fillStyle: '',
            fillRect: () => {},
            strokeRect: () => {}
        };
        
        const canvas = dom.window.document.getElementById('gameCanvas');
        canvas.getContext = () => mockContext;
        
        const { GameUI } = await import('../src/ui.js');
        
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.float({ min: 0, max: Math.fround(9999.99), noNaN: true }), { minLength: 2, maxLength: 10 }), // sequence of balances
                async (balances) => {
                    const ui = new GameUI();
                    const tokenBalanceElement = document.getElementById('tokenBalance');
                    
                    // Update balance multiple times
                    for (const balance of balances) {
                        ui.renderTokenBalance(balance);
                        
                        // Verify the latest balance is displayed
                        const displayedText = tokenBalanceElement.textContent;
                        const numericPart = displayedText.replace(' TETRI', '').trim();
                        const displayedBalance = parseFloat(numericPart);
                        
                        // Should match the current balance
                        expect(Math.abs(displayedBalance - balance)).toBeLessThan(0.01);
                    }
                    
                    // Final displayed balance should match the last balance in the sequence
                    const finalDisplayedText = tokenBalanceElement.textContent;
                    const finalNumericPart = finalDisplayedText.replace(' TETRI', '').trim();
                    const finalDisplayedBalance = parseFloat(finalNumericPart);
                    const lastBalance = balances[balances.length - 1];
                    
                    expect(Math.abs(finalDisplayedBalance - lastBalance)).toBeLessThan(0.01);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
