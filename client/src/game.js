/**
 * TetrisGame - Core Tetris Engine
 * 
 * This module implements the core Tetris game mechanics including:
 * - Game grid management
 * - Piece movement and rotation
 * - Line clearing and scoring
 * - Game over detection
 */

import { PieceGenerator } from './random.js';

// Grid dimensions
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

// Tetromino piece types (1-7)
const PIECE_TYPES = {
    I: 1,
    O: 2,
    T: 3,
    S: 4,
    Z: 5,
    J: 6,
    L: 7
};

// Tetromino shapes - each piece has 4 rotation states
// Represented as 4x4 matrices where 1 = filled, 0 = empty
const PIECE_SHAPES = {
    [PIECE_TYPES.I]: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0]
        ],
        // Rotation 3
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    [PIECE_TYPES.O]: [
        // Rotation 0-3 (all same for O piece)
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ]
    ],
    [PIECE_TYPES.T]: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    [PIECE_TYPES.S]: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ],
    [PIECE_TYPES.Z]: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0],
            [1, 0, 0, 0]
        ]
    ],
    [PIECE_TYPES.J]: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 0, 0]
        ]
    ],
    [PIECE_TYPES.L]: [
        // Rotation 0
        [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        // Rotation 1
        [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0]
        ],
        // Rotation 2
        [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0]
        ],
        // Rotation 3
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ]
    ]
};

/**
 * Represents a Tetris piece
 */
class Piece {
    constructor(type, rotation = 0, x = 3, y = 0) {
        this.type = type;
        this.rotation = rotation;
        this.x = x;
        this.y = y;
        this.shape = PIECE_SHAPES[type][rotation];
    }

    /**
     * Get the shape matrix for the current rotation
     */
    getShape() {
        return PIECE_SHAPES[this.type][this.rotation];
    }

    /**
     * Create a copy of this piece
     */
    clone() {
        return new Piece(this.type, this.rotation, this.x, this.y);
    }
}

/**
 * Main Tetris Game class
 */
export class TetrisGame {
    constructor(seed = null) {
        this.seed = seed;
        this.pieceGenerator = seed ? new PieceGenerator(seed) : null;
        this.grid = this.createEmptyGrid();
        this.currentPiece = null;
        this.nextPiece = null;
        this.nextQueue = []; // Queue of next 4 pieces
        this.holdPiece = null; // Held piece
        this.canHold = true; // Can only hold once per piece
        this.score = 0;
        this.linesCleared = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
    }

    /**
     * Create an empty 10x20 grid
     */
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            grid[y] = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                grid[y][x] = 0;
            }
        }
        return grid;
    }

    /**
     * Get the ghost piece position (where piece would land with hard drop)
     */
    getGhostPiece() {
        if (!this.currentPiece) {
            return null;
        }

        // Create a copy of the current piece
        const ghost = this.currentPiece.clone();
        
        // Drop it down until it collides
        while (!this.checkCollision(ghost, 0, 1)) {
            ghost.y++;
        }
        
        return ghost;
    }

    /**
     * Get the current game state
     */
    getState() {
        return {
            grid: this.grid,
            currentPiece: this.currentPiece,
            ghostPiece: this.getGhostPiece(),
            nextPiece: this.nextPiece,
            nextQueue: this.nextQueue,
            holdPiece: this.holdPiece,
            score: this.score,
            linesCleared: this.linesCleared,
            level: this.level,
            isGameOver: this.isGameOver,
            isPaused: this.isPaused,
            seed: this.seed,
            completeLines: this.getCompleteLines()
        };
    }

    /**
     * Hold the current piece (press C)
     */
    holdCurrentPiece() {
        if (!this.canHold || !this.currentPiece || this.isGameOver || this.isPaused) {
            return false;
        }

        if (this.holdPiece === null) {
            // First time holding - store current piece and spawn next
            this.holdPiece = new Piece(this.currentPiece.type, 0, 3, 0);
            this.spawnNextPiece();
        } else {
            // Swap current with held piece
            const temp = this.holdPiece;
            this.holdPiece = new Piece(this.currentPiece.type, 0, 3, 0);
            this.currentPiece = new Piece(temp.type, 0, 3, 0);
        }

        this.canHold = false; // Can't hold again until next piece
        return true;
    }

    /**
     * Check if a piece collides with the grid or boundaries
     */
    checkCollision(piece, offsetX = 0, offsetY = 0) {
        const shape = piece.getShape();
        const newX = piece.x + offsetX;
        const newY = piece.y + offsetY;

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    const gridX = newX + x;
                    const gridY = newY + y;

                    // Check boundaries
                    if (gridX < 0 || gridX >= GRID_WIDTH || gridY >= GRID_HEIGHT) {
                        return true;
                    }

                    // Check collision with locked pieces (only if within grid)
                    if (gridY >= 0 && this.grid[gridY][gridX] !== 0) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Move the current piece left
     */
    moveLeft() {
        if (!this.currentPiece || this.isGameOver || this.isPaused) {
            return false;
        }

        if (!this.checkCollision(this.currentPiece, -1, 0)) {
            this.currentPiece.x--;
            return true;
        }
        return false;
    }

    /**
     * Move the current piece right
     */
    moveRight() {
        if (!this.currentPiece || this.isGameOver || this.isPaused) {
            return false;
        }

        if (!this.checkCollision(this.currentPiece, 1, 0)) {
            this.currentPiece.x++;
            return true;
        }
        return false;
    }

    /**
     * Move the current piece down
     */
    moveDown() {
        if (!this.currentPiece || this.isGameOver || this.isPaused) {
            return false;
        }

        if (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            return true;
        }
        return false;
    }

    /**
     * Drop the piece to the bottom instantly
     */
    hardDrop() {
        if (!this.currentPiece || this.isGameOver || this.isPaused) {
            return 0;
        }

        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        
        return dropDistance;
    }

    /**
     * Rotate the current piece clockwise
     */
    rotate() {
        if (!this.currentPiece || this.isGameOver || this.isPaused) {
            return false;
        }

        const originalRotation = this.currentPiece.rotation;
        const newRotation = (originalRotation + 1) % 4;
        
        // Create a temporary piece with new rotation
        const tempPiece = this.currentPiece.clone();
        tempPiece.rotation = newRotation;
        tempPiece.shape = PIECE_SHAPES[tempPiece.type][newRotation];

        // Check if rotation is valid
        if (!this.checkCollision(tempPiece, 0, 0)) {
            this.currentPiece.rotation = newRotation;
            this.currentPiece.shape = PIECE_SHAPES[this.currentPiece.type][newRotation];
            return true;
        }

        // Try wall kicks (simple implementation)
        // Try moving left
        if (!this.checkCollision(tempPiece, -1, 0)) {
            this.currentPiece.x--;
            this.currentPiece.rotation = newRotation;
            this.currentPiece.shape = PIECE_SHAPES[this.currentPiece.type][newRotation];
            return true;
        }

        // Try moving right
        if (!this.checkCollision(tempPiece, 1, 0)) {
            this.currentPiece.x++;
            this.currentPiece.rotation = newRotation;
            this.currentPiece.shape = PIECE_SHAPES[this.currentPiece.type][newRotation];
            return true;
        }

        return false;
    }

    /**
     * Lock the current piece into the grid
     */
    lockPiece() {
        if (!this.currentPiece) {
            return;
        }

        const shape = this.currentPiece.getShape();
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    const gridX = this.currentPiece.x + x;
                    const gridY = this.currentPiece.y + y;
                    
                    if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                        this.grid[gridY][gridX] = this.currentPiece.type;
                    }
                }
            }
        }
    }

    /**
     * Handle keyboard input
     */
    handleInput(key) {
        if (this.isGameOver || this.isPaused) {
            return false;
        }

        switch (key) {
            case 'ArrowLeft':
                return this.moveLeft();
            case 'ArrowRight':
                return this.moveRight();
            case 'ArrowDown':
                return this.moveDown();
            case 'ArrowUp':
            case ' ':  // Space bar for rotation
                return this.rotate();
            default:
                return false;
        }
    }

    /**
     * Check if a line is complete (all cells filled)
     */
    isLineComplete(y) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (this.grid[y][x] === 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Clear a line and shift rows down
     */
    clearLine(lineY) {
        // Remove the line
        this.grid.splice(lineY, 1);
        
        // Add new empty line at top
        const newLine = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            newLine[x] = 0;
        }
        this.grid.unshift(newLine);
    }

    /**
     * Get indices of complete lines (for animation)
     */
    getCompleteLines() {
        const completeLines = [];
        for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
            if (this.isLineComplete(y)) {
                completeLines.push(y);
            }
        }
        return completeLines;
    }

    /**
     * Clear all complete lines and return the number cleared
     */
    clearLines() {
        let linesCleared = 0;
        
        // Check from bottom to top
        for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
            if (this.isLineComplete(y)) {
                this.clearLine(y);
                linesCleared++;
                y++; // Check the same line again since rows shifted down
            }
        }

        return linesCleared;
    }

    /**
     * Calculate score based on lines cleared
     * Standard Tetris scoring:
     * 1 line = 100 * level
     * 2 lines = 300 * level
     * 3 lines = 500 * level
     * 4 lines (Tetris) = 800 * level
     */
    calculateScore(linesCleared) {
        const scoreTable = {
            1: 100,
            2: 300,
            3: 500,
            4: 800
        };

        const baseScore = scoreTable[linesCleared] || 0;
        return baseScore * this.level;
    }

    /**
     * Update score and level based on lines cleared
     */
    updateScore(linesCleared) {
        if (linesCleared > 0) {
            this.linesCleared += linesCleared;
            this.score += this.calculateScore(linesCleared);
            
            // Level up every 10 lines
            this.level = Math.floor(this.linesCleared / 10) + 1;
        }
    }

    /**
     * Check if the game is over
     * Game is over when pieces stack to the top (y = 0)
     */
    checkGameOver() {
        // Check if any cells in the top row (y = 0) are filled
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (this.grid[0][x] !== 0) {
                this.isGameOver = true;
                return true;
            }
        }
        return false;
    }

    /**
     * Spawn a new piece at the top center
     */
    spawnPiece(pieceType) {
        // Pieces spawn at top center (x = 3 or 4, y = 0)
        const piece = new Piece(pieceType, 0, 3, 0);
        
        // Check if spawn position is valid
        if (this.checkCollision(piece, 0, 0)) {
            this.isGameOver = true;
            return null;
        }

        return piece;
    }

    /**
     * Spawn the next piece from the queue
     */
    spawnNextPiece() {
        // Make sure queue has pieces
        if (this.nextQueue.length === 0) {
            this.fillNextQueue();
        }
        
        if (this.nextQueue.length > 0) {
            const nextType = this.nextQueue.shift();
            this.currentPiece = this.spawnPiece(nextType);
            
            // Refill queue to maintain 4 pieces
            this.fillNextQueue();
        }
        
        this.canHold = true; // Can hold again with new piece
    }

    /**
     * Fill the next queue with pieces
     */
    fillNextQueue() {
        while (this.nextQueue.length < 4) {
            if (this.pieceGenerator) {
                this.nextQueue.push(this.pieceGenerator.nextPiece());
            } else {
                this.nextQueue.push(Math.floor(Math.random() * 7) + 1);
            }
        }
    }

    /**
     * Main game update loop
     * Called when a piece needs to be locked and a new one spawned
     */
    update() {
        if (this.isGameOver || this.isPaused) {
            return;
        }

        // Try to move piece down
        if (!this.moveDown()) {
            // Piece can't move down, lock it
            this.lockPiece();
            
            // Clear any complete lines
            const linesCleared = this.clearLines();
            this.updateScore(linesCleared);
            
            // Check for game over
            if (this.checkGameOver()) {
                return;
            }

            // Spawn next piece from queue
            this.spawnNextPiece();
        }
    }

    /**
     * Clear lines with delay (for animation)
     * Returns the lines that will be cleared
     */
    clearLinesDelayed() {
        const linesToClear = this.getCompleteLines();
        return linesToClear;
    }

    /**
     * Actually perform the line clear (called after animation)
     */
    performLineClear() {
        const linesCleared = this.clearLines();
        this.updateScore(linesCleared);
        return linesCleared;
    }

    /**
     * Start a new game
     */
    start() {
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.linesCleared = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.holdPiece = null;
        this.canHold = true;
        this.nextQueue = [];
        
        // Reset piece generator if we have a seed
        if (this.pieceGenerator) {
            this.pieceGenerator.reset();
        }
        
        // Fill the next queue with 4 pieces
        this.fillNextQueue();
        
        // Spawn first piece
        this.spawnNextPiece();
    }

    /**
     * Reset the game
     */
    reset() {
        this.start();
    }

    /**
     * Pause/unpause the game
     */
    togglePause() {
        this.isPaused = !this.isPaused;
    }

    /**
     * Add garbage lines to the bottom of the grid (for multiplayer)
     * @param {number} numLines - Number of garbage lines to add
     */
    addGarbageLines(numLines) {
        if (this.isGameOver || numLines <= 0) {
            return;
        }

        // Remove top rows
        this.grid.splice(0, numLines);

        // Add garbage lines at the bottom
        for (let i = 0; i < numLines; i++) {
            const garbageLine = [];
            // Random gap position (0-9)
            const gapPosition = Math.floor(Math.random() * GRID_WIDTH);
            
            for (let x = 0; x < GRID_WIDTH; x++) {
                // 8 = garbage block type
                garbageLine[x] = (x === gapPosition) ? 0 : 8;
            }
            
            this.grid.push(garbageLine);
        }

        // Check if current piece is now colliding (game over)
        if (this.currentPiece && this.checkCollision(this.currentPiece, 0, 0)) {
            this.isGameOver = true;
        }
    }

    /**
     * Calculate garbage lines to send based on lines cleared
     * @param {number} linesCleared - Number of lines cleared
     * @returns {number} - Number of garbage lines to send
     */
    static calculateGarbageLines(linesCleared) {
        switch (linesCleared) {
            case 1:
                return 0;
            case 2:
                return 1;
            case 3:
                return 2;
            case 4:
                return 4; // Tetris!
            default:
                return 0;
        }
    }
}

// Export constants for testing
export { GRID_WIDTH, GRID_HEIGHT, PIECE_TYPES, PIECE_SHAPES, Piece };
