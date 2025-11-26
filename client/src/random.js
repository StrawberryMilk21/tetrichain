/**
 * PieceGenerator - Deterministic Piece Generation
 * 
 * This module implements deterministic piece generation using a seed
 * to ensure provably fair gameplay.
 */

/**
 * Seeded Random Number Generator
 * Uses a simple Linear Congruential Generator (LCG) algorithm
 * for deterministic pseudo-random number generation
 */
class SeededRandom {
    constructor(seed) {
        // Convert seed to a number if it's a Uint8Array or array
        if (seed instanceof Uint8Array || Array.isArray(seed)) {
            // Hash the seed bytes into a single number
            this.state = 0;
            for (let i = 0; i < seed.length; i++) {
                this.state = ((this.state << 5) - this.state + seed[i]) | 0;
            }
            // Ensure positive state
            this.state = Math.abs(this.state);
        } else {
            this.state = Math.abs(seed) || 1;
        }
        
        // Ensure state is non-zero
        if (this.state === 0) {
            this.state = 1;
        }
    }

    /**
     * Generate next random number (0 to 1)
     * Using LCG: X(n+1) = (a * X(n) + c) mod m
     */
    next() {
        // LCG parameters (from Numerical Recipes)
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        
        this.state = (a * this.state + c) % m;
        return this.state / m;
    }

    /**
     * Generate random integer in range [min, max] inclusive
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

/**
 * PieceGenerator - Generates Tetris pieces deterministically from a seed
 */
export class PieceGenerator {
    constructor(seed) {
        if (!seed) {
            throw new Error('PieceGenerator requires a seed');
        }
        
        this.seed = seed;
        this.rng = new SeededRandom(seed);
        this.pieceCount = 0;
    }

    /**
     * Generate the next piece type (1-7)
     * Returns a piece type: I=1, O=2, T=3, S=4, Z=5, J=6, L=7
     */
    nextPiece() {
        this.pieceCount++;
        // Generate a random piece type from 1 to 7
        return this.rng.nextInt(1, 7);
    }

    /**
     * Get the current piece count
     */
    getPieceCount() {
        return this.pieceCount;
    }

    /**
     * Reset the generator (for testing purposes)
     */
    reset() {
        this.rng = new SeededRandom(this.seed);
        this.pieceCount = 0;
    }
}
