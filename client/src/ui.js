/**
 * GameUI - User Interface Management
 * 
 * This module manages all UI interactions including:
 * - Game rendering
 * - Leaderboard display
 * - Wallet status display
 * - Error and success messages
 * - Loading states
 */

// Grid dimensions
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 30; // pixels per cell

// Colors for each piece type (1-7)
const PIECE_COLORS = {
    0: '#000000', // Empty cell
    1: '#00f0f0', // I - Cyan
    2: '#f0f000', // O - Yellow
    3: '#a000f0', // T - Purple
    4: '#00f000', // S - Green
    5: '#f00000', // Z - Red
    6: '#0000f0', // J - Blue
    7: '#f0a000'  // L - Orange
};

/**
 * GameUI class - Manages all UI rendering and updates
 */
export class GameUI {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.linesElement = document.getElementById('lines');
        this.levelElement = document.getElementById('level');
        this.finalScoreElement = document.getElementById('finalScore');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        
        // Initialize canvas
        this.initCanvas();
    }

    /**
     * Initialize canvas settings
     */
    initCanvas() {
        // Set canvas size
        this.canvas.width = GRID_WIDTH * CELL_SIZE;
        this.canvas.height = GRID_HEIGHT * CELL_SIZE;
        
        // Set rendering context properties
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
    }

    /**
     * Draw a single cell on the canvas
     */
    drawCell(x, y, color) {
        // Fill the cell
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * CELL_SIZE,
            y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
        
        // Draw cell border for non-empty cells
        if (color !== PIECE_COLORS[0]) {
            this.ctx.strokeStyle = '#000';
            this.ctx.strokeRect(
                x * CELL_SIZE,
                y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    /**
     * Draw the game grid with locked pieces
     */
    drawGrid(grid) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const cellValue = grid[y][x];
                const color = PIECE_COLORS[cellValue] || PIECE_COLORS[0];
                this.drawCell(x, y, color);
            }
        }
    }

    /**
     * Draw the active falling piece
     */
    drawPiece(piece) {
        if (!piece) return;
        
        const shape = piece.getShape();
        const color = PIECE_COLORS[piece.type];
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    const gridX = piece.x + x;
                    const gridY = piece.y + y;
                    
                    // Only draw if within visible grid
                    if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                        this.drawCell(gridX, gridY, color);
                    }
                }
            }
        }
    }

    /**
     * Draw the next piece preview
     * This draws a small preview of the next piece in a designated area
     */
    drawNextPiece(piece) {
        if (!piece) return;
        
        // For now, we'll skip the next piece preview as it requires additional canvas
        // This can be enhanced in future iterations
        // The main game rendering is the priority for this task
    }

    /**
     * Clear the entire canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Render the complete game state
     * This is the main rendering function called each frame
     */
    renderGame(gameState) {
        if (!gameState) return;
        
        // Clear canvas
        this.clearCanvas();
        
        // Draw the grid with locked pieces
        this.drawGrid(gameState.grid);
        
        // Draw the active piece on top
        this.drawPiece(gameState.currentPiece);
        
        // Update score display
        this.updateScoreDisplay(gameState.score, gameState.linesCleared, gameState.level);
    }

    /**
     * Update the score, lines, and level display
     */
    updateScoreDisplay(score, lines, level) {
        if (this.scoreElement) {
            this.scoreElement.textContent = score;
        }
        if (this.linesElement) {
            this.linesElement.textContent = lines;
        }
        if (this.levelElement) {
            this.levelElement.textContent = level;
        }
    }

    /**
     * Show the game over screen
     */
    showGameOver(finalScore) {
        if (this.gameOverScreen) {
            this.gameOverScreen.classList.remove('hidden');
        }
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = finalScore;
        }
    }

    /**
     * Hide the game over screen
     */
    hideGameOver() {
        if (this.gameOverScreen) {
            this.gameOverScreen.classList.add('hidden');
        }
    }

    /**
     * Render leaderboard data
     * Requirements: 3.3, 3.5, 7.4
     * - Display top 10 scores in table format
     * - Show player address, score, and timestamp
     * - Highlight current player's score
     */
    renderLeaderboard(scores, currentPlayerAddress = null) {
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) return;
        
        if (!scores || scores.length === 0) {
            leaderboardList.innerHTML = '<p class="empty-state">No scores yet. Be the first!</p>';
            return;
        }
        
        leaderboardList.innerHTML = '';
        
        scores.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            
            // Highlight current player's score
            if (currentPlayerAddress && entry.player === currentPlayerAddress) {
                entryDiv.classList.add('highlight');
            }
            
            entryDiv.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-player">${this.formatAddress(entry.player)}</span>
                <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
                <span class="leaderboard-timestamp">${this.formatTimestamp(entry.timestamp)}</span>
            `;
            
            leaderboardList.appendChild(entryDiv);
        });
    }

    /**
     * Format timestamp for display
     * Converts Unix timestamp (milliseconds) to readable date/time
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Show relative time for recent scores
        if (diffMins < 1) {
            return 'Just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            // Show date for older scores
            return date.toLocaleDateString();
        }
    }

    /**
     * Format wallet address for display (show first 6 and last 4 characters)
     */
    formatAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Render wallet status
     */
    renderWalletStatus(address, balance = null) {
        const walletConnected = document.getElementById('walletConnected');
        const walletDisconnected = document.getElementById('walletDisconnected');
        const walletAddress = document.getElementById('walletAddress');
        
        if (address) {
            // Wallet is connected
            if (walletConnected) walletConnected.classList.remove('hidden');
            if (walletDisconnected) walletDisconnected.classList.add('hidden');
            if (walletAddress) walletAddress.textContent = address;
        } else {
            // Wallet is disconnected
            if (walletConnected) walletConnected.classList.add('hidden');
            if (walletDisconnected) walletDisconnected.classList.remove('hidden');
        }
        
        // Update token balance if provided
        if (balance !== null) {
            this.renderTokenBalance(balance);
        }
    }

    /**
     * Render token balance
     * Requirements: 4.4, 7.4
     * - Display total earned tokens
     * - Update after score submission
     * - Show in blockchain features section
     */
    renderTokenBalance(balance) {
        const tokenBalance = document.getElementById('tokenBalance');
        
        if (tokenBalance) {
            // Format balance with appropriate precision
            const formattedBalance = typeof balance === 'number' 
                ? balance.toFixed(2) 
                : '0.00';
            tokenBalance.textContent = `${formattedBalance} TETRI`;
        }
    }

    /**
     * Get actionable next steps for common errors
     * Requirements: 6.5, 8.1
     * 
     * @param {string} errorMessage - The error message
     * @returns {string} Suggested next steps
     */
    getErrorNextSteps(errorMessage) {
        if (errorMessage.includes('Wallet not connected')) {
            return '\n\nNext steps: Click the "Connect Wallet" button to connect your OneWallet.';
        }
        
        if (errorMessage.includes('Invalid score')) {
            return '\n\nNext steps: Please finish a valid game before submitting your score.';
        }
        
        if (errorMessage.includes('seed has already been used')) {
            return '\n\nNext steps: Start a new game to get a fresh game seed, then play and submit that score.';
        }
        
        if (errorMessage.includes('Invalid game seed') || errorMessage.includes('No blockchain game seed')) {
            return '\n\nNext steps: Make sure your wallet is connected before starting a new game.';
        }
        
        if (errorMessage.includes('Insufficient SUI')) {
            return '\n\nNext steps: Add SUI to your wallet from a faucet or exchange, then try again.';
        }
        
        if (errorMessage.includes('Network connection lost')) {
            return '\n\nNext steps: Check your internet connection. You can continue playing offline.';
        }
        
        if (errorMessage.includes('OneWallet not installed')) {
            return '\n\nNext steps: Install the OneWallet browser extension from your browser\'s extension store.';
        }
        
        if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
            return '\n\nNext steps: Approve the transaction in your OneWallet popup to continue.';
        }
        
        return ''; // No specific next steps for this error
    }
    
    /**
     * Show error message
     * Requirements: 6.5, 8.1, 8.3
     * 
     * @param {string} message - The error message to display
     * @param {string} gasEstimate - Optional gas estimate for transaction errors
     */
    showError(message, gasEstimate = null) {
        const errorToast = document.getElementById('errorToast');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorMessage) {
            // Add gas estimate if provided
            let fullMessage = message;
            if (gasEstimate) {
                fullMessage += `\n\nEstimated gas needed: ${gasEstimate}`;
            }
            
            // Add actionable next steps
            const nextSteps = this.getErrorNextSteps(message);
            if (nextSteps) {
                fullMessage += nextSteps;
            }
            
            errorMessage.textContent = fullMessage;
        }
        
        if (errorToast) {
            errorToast.classList.remove('hidden');
            
            // Auto-hide after 10 seconds (longer for error messages with more info)
            setTimeout(() => {
                errorToast.classList.add('hidden');
            }, 10000);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successToast = document.getElementById('successToast');
        const successMessage = document.getElementById('successMessage');
        
        if (successMessage) {
            successMessage.textContent = message;
        }
        
        if (successToast) {
            successToast.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                successToast.classList.add('hidden');
            }, 5000);
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Processing transaction...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }
}
