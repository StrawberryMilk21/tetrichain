/**
 * TetriChain - Main Entry Point
 * 
 * This is the main entry point for the TetriChain game client.
 * It initializes the game engine, blockchain interface, and UI components.
 */

import { TetrisGame } from './game.js';
import { GameUI } from './ui.js';
import { BlockchainInterface } from './blockchain.js';

console.log('TetriChain initialized');

// Initialize UI and blockchain interface
const ui = new GameUI();
const blockchain = new BlockchainInterface();

// Game state
let game = null;
let gameLoop = null;
let dropInterval = 1000; // milliseconds between automatic drops
let currentGameSeedObjectId = null; // Store the game seed object ID for score submission

// Get UI elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const closeErrorBtn = document.getElementById('closeErrorBtn');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
const connectWalletBtn = document.getElementById('connectWalletBtn');
const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');
const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');

// Start game
async function startGame() {
    try {
        let seed = null;
        currentGameSeedObjectId = null; // Reset game seed object ID
        
        // If wallet is connected, create a blockchain seed
        if (blockchain.isWalletConnected()) {
            // Show loading indicator
            ui.showLoading('Creating game seed on blockchain...');
            
            // Create game seed on blockchain
            const result = await blockchain.createGameSeed();
            
            // Hide loading indicator
            ui.hideLoading();
            
            if (result.success) {
                seed = result.seed;
                currentGameSeedObjectId = result.gameSeedObjectId; // Store for score submission
                console.log('Using blockchain seed for game', { gameSeedObjectId: currentGameSeedObjectId });
                ui.showSuccess('Game seed created on blockchain!');
            } else {
                // Show error but allow game to continue with random seed
                ui.showError(`Failed to create blockchain seed: ${result.error}. Playing with random seed.`, result.gasEstimate);
                console.warn('Falling back to random seed');
            }
        } else {
            console.log('Wallet not connected, using random seed');
        }
        
        // Initialize game with seed (or null for random)
        game = new TetrisGame(seed);
        game.start();
        
        // Update UI
        ui.hideGameOver();
        ui.renderGame(game.getState());
        
        // Enable pause button
        pauseBtn.disabled = false;
        startBtn.disabled = true;
        
        // Start game loop
        startGameLoop();
        
    } catch (error) {
        console.error('Error starting game:', error);
        ui.hideLoading();
        ui.showError(`Failed to start game: ${error.message}`);
    }
}

// Game loop
function startGameLoop() {
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    gameLoop = setInterval(() => {
        if (game && !game.isGameOver && !game.isPaused) {
            game.update();
            ui.renderGame(game.getState());
            
            // Check if game is over
            if (game.isGameOver) {
                stopGameLoop();
                ui.showGameOver(game.score);
                startBtn.disabled = false;
                pauseBtn.disabled = true;
            }
        }
    }, dropInterval);
}

// Stop game loop
function stopGameLoop() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
}

// Pause/unpause game
function togglePause() {
    if (game) {
        game.togglePause();
        pauseBtn.textContent = game.isPaused ? 'Resume' : 'Pause';
    }
}

// Play again
async function playAgain() {
    await startGame();
}

// Handle keyboard input
function handleKeyPress(event) {
    if (game && !game.isGameOver) {
        const handled = game.handleInput(event.key);
        
        if (handled) {
            event.preventDefault();
            ui.renderGame(game.getState());
        }
        
        // Space bar for hard drop
        if (event.key === ' ') {
            event.preventDefault();
            game.hardDrop();
            game.update(); // Lock piece and spawn new one
            ui.renderGame(game.getState());
        }
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
playAgainBtn.addEventListener('click', playAgain);
document.addEventListener('keydown', handleKeyPress);

// Close toast notifications
if (closeErrorBtn) {
    closeErrorBtn.addEventListener('click', () => {
        document.getElementById('errorToast').classList.add('hidden');
    });
}

if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
        document.getElementById('successToast').classList.add('hidden');
    });
}

// Submit score button
if (submitScoreBtn) {
    submitScoreBtn.addEventListener('click', async () => {
        try {
            // Check if wallet is connected
            if (!blockchain.isWalletConnected()) {
                ui.showError('Please connect your wallet to submit scores');
                return;
            }

            // Check if we have a game seed object ID
            if (!currentGameSeedObjectId) {
                ui.showError('No blockchain game seed found. Please start a new game with wallet connected.');
                return;
            }

            // Check if game is over
            if (!game || !game.isGameOver) {
                ui.showError('Please finish the game before submitting your score');
                return;
            }

            // Get the final score
            const finalScore = game.score;

            // Show loading indicator
            ui.showLoading('Submitting score to blockchain...');

            // Submit score to blockchain
            const result = await blockchain.submitScore(currentGameSeedObjectId, finalScore);

            // Hide loading indicator
            ui.hideLoading();

            if (result.success) {
                // Show success message with tokens earned
                ui.showSuccess(`Score submitted! You earned ${result.tokensEarned} TETRI tokens!`);
                
                // Disable submit button to prevent double submission
                submitScoreBtn.disabled = true;
                
                // Clear the game seed object ID
                currentGameSeedObjectId = null;
                
                // Refresh leaderboard and balance to show new score and tokens
                await refreshLeaderboard();
                await refreshBalance();
            } else {
                // Show error message with gas estimate
                ui.showError(result.error || 'Failed to submit score', result.gasEstimate);
            }

        } catch (error) {
            console.error('Error in submit score handler:', error);
            ui.hideLoading();
            ui.showError(`Failed to submit score: ${error.message}`);
        }
    });
}

// Wallet connection handlers
if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', async () => {
        ui.showLoading('Connecting to OneWallet...');
        
        const result = await blockchain.connectWallet();
        
        ui.hideLoading();
        
        if (result.success) {
            // Update UI to show connected state
            ui.renderWalletStatus(result.address);
            ui.showSuccess(`Wallet connected: ${ui.formatAddress(result.address)}`);
            
            // Enable blockchain features
            enableBlockchainFeatures();
            
            // Automatically refresh leaderboard and balance
            await refreshLeaderboard();
            await refreshBalance();
        } else {
            // Show error with retry option
            ui.showError(result.error || 'Failed to connect wallet. Please try again.');
        }
    });
}

if (disconnectWalletBtn) {
    disconnectWalletBtn.addEventListener('click', async () => {
        const result = await blockchain.disconnectWallet();
        
        if (result.success) {
            // Update UI to show disconnected state
            ui.renderWalletStatus(null);
            ui.showSuccess('Wallet disconnected');
            
            // Disable blockchain features
            disableBlockchainFeatures();
        } else {
            ui.showError(result.error || 'Failed to disconnect wallet');
        }
    });
}

// Refresh balance button
if (refreshBalanceBtn) {
    refreshBalanceBtn.addEventListener('click', async () => {
        await refreshBalance();
    });
}

// Refresh leaderboard button
if (refreshLeaderboardBtn) {
    refreshLeaderboardBtn.addEventListener('click', async () => {
        await refreshLeaderboard();
    });
}

/**
 * Refresh the leaderboard from the blockchain
 * Requirements: 3.3, 3.5, 7.4, 8.2, 8.5
 */
async function refreshLeaderboard() {
    try {
        // Check network connectivity first
        if (!blockchain.isNetworkAvailable()) {
            ui.showError('Cannot fetch leaderboard while offline. Please check your internet connection.');
            return;
        }
        
        // Show loading indicator
        ui.showLoading('Fetching leaderboard...');
        
        // Fetch leaderboard from blockchain
        const result = await blockchain.getLeaderboard();
        
        // Hide loading indicator
        ui.hideLoading();
        
        if (result.success) {
            // Get current player address for highlighting
            const currentPlayerAddress = blockchain.getPlayerAddress();
            
            // Render leaderboard
            ui.renderLeaderboard(result.scores, currentPlayerAddress);
            
            console.log('Leaderboard refreshed successfully');
        } else {
            // Show error message
            ui.showError(result.error || 'Failed to fetch leaderboard');
        }
    } catch (error) {
        console.error('Error refreshing leaderboard:', error);
        ui.hideLoading();
        ui.showError(`Failed to refresh leaderboard: ${error.message}`);
    }
}

/**
 * Refresh the player's token balance from the blockchain
 * Requirements: 4.4, 7.4, 8.2, 8.5
 */
async function refreshBalance() {
    try {
        // Check if wallet is connected
        if (!blockchain.isWalletConnected()) {
            ui.showError('Please connect your wallet first');
            return;
        }
        
        // Check network connectivity first
        if (!blockchain.isNetworkAvailable()) {
            ui.showError('Cannot fetch balance while offline. Please check your internet connection.');
            return;
        }

        // Show loading indicator
        ui.showLoading('Fetching token balance...');
        
        // Fetch balance from blockchain
        const result = await blockchain.getPlayerBalance();
        
        // Hide loading indicator
        ui.hideLoading();
        
        if (result.success) {
            // Render token balance
            ui.renderTokenBalance(result.balance);
            
            console.log('Token balance refreshed successfully:', result.balance);
        } else {
            // Show error message
            ui.showError(result.error || 'Failed to fetch token balance');
        }
    } catch (error) {
        console.error('Error refreshing balance:', error);
        ui.hideLoading();
        ui.showError(`Failed to refresh token balance: ${error.message}`);
    }
}

/**
 * Enable blockchain features when wallet is connected
 */
function enableBlockchainFeatures() {
    // Enable submit score button
    if (submitScoreBtn) {
        submitScoreBtn.disabled = false;
    }
    
    // Enable refresh buttons
    if (refreshBalanceBtn) {
        refreshBalanceBtn.disabled = false;
    }
    if (refreshLeaderboardBtn) {
        refreshLeaderboardBtn.disabled = false;
    }
}

/**
 * Disable blockchain features when wallet is disconnected
 */
function disableBlockchainFeatures() {
    // Disable submit score button
    if (submitScoreBtn) {
        submitScoreBtn.disabled = true;
    }
    
    // Disable refresh buttons
    if (refreshBalanceBtn) {
        refreshBalanceBtn.disabled = true;
    }
    if (refreshLeaderboardBtn) {
        refreshLeaderboardBtn.disabled = true;
    }
    
    // Clear leaderboard display
    const leaderboardList = document.getElementById('leaderboardList');
    if (leaderboardList) {
        leaderboardList.innerHTML = '<p class="empty-state">Connect wallet to view leaderboard</p>';
    }
    
    // Reset token balance display
    ui.renderTokenBalance(0);
}

/**
 * Handle network status changes
 * Requirements: 8.2, 8.5
 */
function handleNetworkStatusChange(isOnline) {
    if (isOnline) {
        console.log('Network connection restored');
        ui.showSuccess('Network connection restored. Blockchain features are now available.');
        
        // Re-enable blockchain features if wallet is connected
        if (blockchain.isWalletConnected()) {
            enableBlockchainFeatures();
        }
    } else {
        console.log('Network connection lost');
        ui.showError('Network connection lost. You can continue playing offline, but blockchain features are temporarily unavailable.');
        
        // Disable blockchain features but allow gameplay to continue
        disableBlockchainFeatures();
    }
}

/**
 * Set up network monitoring
 * Requirements: 8.2, 8.5
 */
function setupNetworkMonitoring() {
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
            handleNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            handleNetworkStatusChange(false);
        });
    }
}

// Initialize blockchain features as disabled
disableBlockchainFeatures();

// Set up network monitoring
setupNetworkMonitoring();

console.log('TetriChain ready to play!');
