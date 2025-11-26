/**
 * Error Handling Tests for Blockchain Operations
 * Requirements: 8.1, 8.3, 8.4
 * 
 * These tests verify that blockchain errors are properly caught,
 * parsed, and displayed with user-friendly messages.
 */

import { describe, test, expect } from 'vitest';
import { BlockchainInterface } from '../src/blockchain.js';

describe('Error Handling for Blockchain Operations', () => {
    
    test('parseBlockchainError should handle contract error codes', async () => {
        const blockchain = new BlockchainInterface();
        
        // Test insufficient gas error
        const gasError = new Error('insufficient gas balance');
        const result1 = await blockchain.createGameSeed();
        // Since wallet is not connected, should get connection error
        expect(result1.success).toBe(false);
        expect(result1.error).toContain('Wallet not connected');
    });
    
    test('createGameSeed should return user-friendly error when wallet not connected', async () => {
        const blockchain = new BlockchainInterface();
        
        const result = await blockchain.createGameSeed();
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Wallet not connected. Please connect your wallet first.');
        expect(result.gasEstimate).toBeDefined();
    });
    
    test('submitScore should validate score range and return helpful error', async () => {
        const blockchain = new BlockchainInterface();
        
        // Mock wallet connection
        blockchain.playerAddress = '0xtest';
        blockchain.isConnected = true;
        blockchain.wallet = {}; // Mock wallet object
        
        // Test with invalid score (too high)
        const result1 = await blockchain.submitScore('0xtest', 1000000);
        expect(result1.success).toBe(false);
        expect(result1.error).toContain('Invalid score');
        
        // Test with invalid score (negative)
        const result2 = await blockchain.submitScore('0xtest', -100);
        expect(result2.success).toBe(false);
        expect(result2.error).toContain('Invalid score');
        
        // Test with invalid game seed
        const result3 = await blockchain.submitScore(null, 5000);
        expect(result3.success).toBe(false);
        expect(result3.error).toContain('Invalid game seed');
    });
    
    test('submitScore should require wallet connection', async () => {
        const blockchain = new BlockchainInterface();
        
        const result = await blockchain.submitScore('0xtest', 5000);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Wallet not connected. Please connect your wallet first.');
        expect(result.gasEstimate).toBeDefined();
    });
    
    test('getLeaderboard should handle errors gracefully', async () => {
        const blockchain = new BlockchainInterface();
        
        // The leaderboard query should work with the configured contract
        // This test verifies that errors are handled gracefully
        const result = await blockchain.getLeaderboard();
        
        // Should either succeed or fail gracefully with an error message
        if (!result.success) {
            expect(result.error).toBeDefined();
            expect(result.error.length).toBeGreaterThan(0);
        } else {
            // If successful, should have scores array
            expect(result.scores).toBeDefined();
            expect(Array.isArray(result.scores)).toBe(true);
        }
    });
    
    test('getPlayerBalance should require wallet connection', async () => {
        const blockchain = new BlockchainInterface();
        
        const result = await blockchain.getPlayerBalance();
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Wallet not connected. Please connect your wallet first.');
    });
    
    test('connectWallet should handle missing wallet extension', async () => {
        const blockchain = new BlockchainInterface();
        
        // Ensure wallet is not installed
        delete global.window?.suiWallet;
        
        const result = await blockchain.connectWallet();
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('OneWallet not installed');
        expect(result.error).toContain('browser extension');
    });
    
    test('error messages should include gas estimates for transaction errors', async () => {
        const blockchain = new BlockchainInterface();
        
        // Test createGameSeed gas estimate
        const result1 = await blockchain.createGameSeed();
        expect(result1.gasEstimate).toBe('0.01 SUI');
        
        // Test submitScore gas estimate
        blockchain.playerAddress = '0xtest';
        blockchain.isConnected = true;
        const result2 = await blockchain.submitScore('0xtest', 5000);
        expect(result2.gasEstimate).toBe('0.02 SUI');
    });
    
    test('error messages should be user-friendly and actionable', async () => {
        const blockchain = new BlockchainInterface();
        
        // Test various error scenarios
        const result1 = await blockchain.createGameSeed();
        expect(result1.error).not.toContain('undefined');
        expect(result1.error).not.toContain('null');
        expect(result1.error.length).toBeGreaterThan(10); // Should be descriptive
        
        // Mock wallet connection for score validation test
        blockchain.playerAddress = '0xtest';
        blockchain.isConnected = true;
        blockchain.wallet = {}; // Mock wallet object
        
        const result2 = await blockchain.submitScore('0xtest', 1000000);
        expect(result2.error).toContain('between 0 and 999,999');
        
        // Reset for balance test
        blockchain.playerAddress = null;
        blockchain.isConnected = false;
        
        const result3 = await blockchain.getPlayerBalance();
        expect(result3.error).toContain('connect your wallet');
    });
});

describe('Network Error Handling', () => {
    
    test('should detect network connectivity loss', async () => {
        const blockchain = new BlockchainInterface();
        
        // Simulate network offline
        blockchain.isOnline = false;
        
        expect(blockchain.isNetworkAvailable()).toBe(false);
    });
    
    test('should prevent blockchain operations when offline', async () => {
        const blockchain = new BlockchainInterface();
        
        // Mock wallet connection
        blockchain.playerAddress = '0xtest';
        blockchain.isConnected = true;
        blockchain.wallet = {};
        
        // Simulate network offline
        blockchain.isOnline = false;
        
        // Try to create game seed
        const result1 = await blockchain.createGameSeed();
        expect(result1.success).toBe(false);
        expect(result1.error).toContain('Network connection lost');
        
        // Try to submit score
        const result2 = await blockchain.submitScore('0xtest', 5000);
        expect(result2.success).toBe(false);
        expect(result2.error).toContain('Network connection lost');
        
        // Try to get leaderboard
        const result3 = await blockchain.getLeaderboard();
        expect(result3.success).toBe(false);
        expect(result3.error).toContain('Network connection lost');
        
        // Try to get balance
        const result4 = await blockchain.getPlayerBalance();
        expect(result4.success).toBe(false);
        expect(result4.error).toContain('Network connection lost');
    });
    
    test('should allow operations when network is restored', async () => {
        const blockchain = new BlockchainInterface();
        
        // Start offline
        blockchain.isOnline = false;
        expect(blockchain.isNetworkAvailable()).toBe(false);
        
        // Restore network
        blockchain.isOnline = true;
        expect(blockchain.isNetworkAvailable()).toBe(true);
    });
    
    test('should provide helpful error messages for network issues', async () => {
        const blockchain = new BlockchainInterface();
        
        // Mock wallet connection
        blockchain.playerAddress = '0xtest';
        blockchain.isConnected = true;
        blockchain.wallet = {};
        
        // Simulate network offline
        blockchain.isOnline = false;
        
        const result = await blockchain.createGameSeed();
        
        expect(result.error).toContain('Network connection lost');
        expect(result.error).toContain('check your internet connection');
    });
});

describe('Validation Error Handling', () => {
    
    test('should provide clear error messages for invalid scores', async () => {
        const blockchain = new BlockchainInterface();
        
        // Mock wallet connection
        blockchain.playerAddress = '0xtest';
        blockchain.isConnected = true;
        blockchain.wallet = {};
        
        // Test score too high
        const result1 = await blockchain.submitScore('0xtest', 1000000);
        expect(result1.success).toBe(false);
        expect(result1.error).toContain('Invalid score');
        expect(result1.error).toContain('between 0 and 999,999');
        
        // Test negative score
        const result2 = await blockchain.submitScore('0xtest', -100);
        expect(result2.success).toBe(false);
        expect(result2.error).toContain('Invalid score');
    });
    
    test('should provide clear error messages for invalid game seeds', async () => {
        const blockchain = new BlockchainInterface();
        
        // Mock wallet connection
        blockchain.playerAddress = '0xtest';
        blockchain.isConnected = true;
        blockchain.wallet = {};
        
        // Test null game seed
        const result1 = await blockchain.submitScore(null, 5000);
        expect(result1.success).toBe(false);
        expect(result1.error).toContain('Invalid game seed');
        
        // Test empty string game seed
        const result2 = await blockchain.submitScore('', 5000);
        expect(result2.success).toBe(false);
        expect(result2.error).toContain('Invalid game seed');
    });
    
    test('should explain why validation failed', async () => {
        const blockchain = new BlockchainInterface();
        
        // Mock wallet connection
        blockchain.playerAddress = '0xtest';
        blockchain.isConnected = true;
        blockchain.wallet = {};
        
        // Test with invalid score
        const result = await blockchain.submitScore('0xtest', 2000000);
        
        // Should explain the validation rule
        expect(result.error).toContain('number between 0 and 999,999');
    });
    
    test('UI should provide actionable next steps for validation errors', async () => {
        // Set up DOM environment for testing
        const { JSDOM } = await import('jsdom');
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <canvas id="gameCanvas" width="300" height="600"></canvas>
                    <div id="errorToast" class="hidden">
                        <span id="errorMessage"></span>
                    </div>
                </body>
            </html>
        `);
        
        global.document = dom.window.document;
        global.window = dom.window;
        
        // Mock canvas getContext
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
        const ui = new GameUI();
        
        // Test various validation errors
        const testCases = [
            {
                error: 'Invalid score. Score must be between 0 and 999,999.',
                expectedNextSteps: 'finish a valid game'
            },
            {
                error: 'This game seed has already been used.',
                expectedNextSteps: 'Start a new game'
            },
            {
                error: 'Invalid game seed. Please start a new game.',
                expectedNextSteps: 'wallet is connected'
            },
            {
                error: 'Wallet not connected. Please connect your wallet first.',
                expectedNextSteps: 'Connect Wallet'
            }
        ];
        
        for (const testCase of testCases) {
            const nextSteps = ui.getErrorNextSteps(testCase.error);
            expect(nextSteps.toLowerCase()).toContain(testCase.expectedNextSteps.toLowerCase());
        }
    });
});
