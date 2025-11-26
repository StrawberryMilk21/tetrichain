import { useState, useEffect, useCallback, useRef } from 'react';
import { TetrisGame } from '../game.js';
import { useSoundEffects } from './useSoundEffects.js';

/**
 * Custom hook for managing Tetris game state and logic
 * Wraps the existing TetrisGame class with React state management
 */
export const useGame = (gameSeed = null) => {
    const [gameState, setGameState] = useState({
        grid: [],
        currentPiece: null,
        nextPiece: null,
        score: 0,
        linesCleared: 0,
        level: 1,
        isGameOver: false,
        isPaused: false
    });
    const [renderTrigger, setRenderTrigger] = useState(0);
    const [isGameActive, setIsGameActive] = useState(false); // Track if game is active
    const [clearingLines, setClearingLines] = useState([]); // Lines currently being cleared (for animation)
    
    const gameRef = useRef(null);
    const gameSeedRef = useRef(gameSeed); // Store seed in ref
    const animationFrameRef = useRef(null);
    const lastDropTimeRef = useRef(0);
    const keysPressed = useRef(new Set()); // Track currently pressed keys
    const keyPressStartRef = useRef({ left: 0, right: 0, down: 0 }); // Track when key was first pressed
    const lastMoveTimeRef = useRef({ left: 0, right: 0, down: 0 }); // Track last move times for ARR
    const previousScoreRef = useRef(0); // Track previous score for line clear detection
    const previousLevelRef = useRef(1); // Track previous level for level up detection
    
    // Sound effects
    const sounds = useSoundEffects();

    // Update seed ref when it changes
    useEffect(() => {
        gameSeedRef.current = gameSeed;
    }, [gameSeed]);

    // Calculate drop interval based on level
    const getDropInterval = useCallback((level) => {
        return Math.max(100, 1000 - (level - 1) * 100);
    }, []);

    // Update React state from game instance
    const updateGameState = useCallback(() => {
        if (gameRef.current) {
            const newState = gameRef.current.getState();
            const oldScore = previousScoreRef.current;
            const oldLevel = previousLevelRef.current;
            
            // Detect line clear by score change
            if (newState.score > oldScore) {
                const scoreDiff = newState.score - oldScore;
                // Calculate lines cleared based on score difference
                // 100*level = 1 line, 300*level = 2 lines, 500*level = 3 lines, 800*level = 4 lines
                const baseScore = scoreDiff / newState.level;
                let linesCleared = 0;
                if (baseScore >= 800) linesCleared = 4;
                else if (baseScore >= 500) linesCleared = 3;
                else if (baseScore >= 300) linesCleared = 2;
                else if (baseScore >= 100) linesCleared = 1;
                
                if (linesCleared === 4) {
                    sounds.playTetris(); // Special sound for Tetris!
                } else if (linesCleared > 0) {
                    sounds.playLineClear(linesCleared);
                }
                
                // Trigger line clear animation
                if (newState.completeLines && newState.completeLines.length > 0) {
                    setClearingLines(newState.completeLines);
                    // Clear animation after 300ms
                    setTimeout(() => {
                        setClearingLines([]);
                    }, 300);
                }
            }
            
            // Detect level up
            if (newState.level > oldLevel) {
                sounds.playLevelUp();
            }
            
            // Detect game over
            if (newState.isGameOver && !gameState.isGameOver) {
                sounds.playGameOver();
            }
            
            previousScoreRef.current = newState.score;
            previousLevelRef.current = newState.level;
            setGameState(newState);
            setRenderTrigger(prev => prev + 1); // Force re-render
        }
    }, [sounds, gameState.isGameOver]);

    // Game loop - only runs when game is active
    useEffect(() => {
        if (!isGameActive || !gameRef.current) {
            return;
        }

        const DAS_DELAY = 170; // Delayed Auto Shift - initial delay before repeat (in ms)
        const ARR_DELAY = 50; // Auto Repeat Rate - delay between repeats (in ms)
        let needsUpdate = false;

        const gameLoop = (timestamp) => {
            if (!gameRef.current) return;
            
            const state = gameRef.current.getState();
            
            // Stop if game over or paused
            if (state.isGameOver || state.isPaused) {
                animationFrameRef.current = requestAnimationFrame(gameLoop);
                return;
            }

            // Handle continuous key presses with DAS (Delayed Auto Shift)
            if (keysPressed.current.has('ArrowLeft')) {
                const timeSincePress = timestamp - keyPressStartRef.current.left;
                const timeSinceLastMove = timestamp - lastMoveTimeRef.current.left;
                
                // Only auto-repeat after DAS delay has passed
                if (timeSincePress >= DAS_DELAY && timeSinceLastMove >= ARR_DELAY) {
                    if (gameRef.current.moveLeft()) {
                        sounds.playMove();
                        needsUpdate = true;
                    }
                    lastMoveTimeRef.current.left = timestamp;
                }
            }

            if (keysPressed.current.has('ArrowRight')) {
                const timeSincePress = timestamp - keyPressStartRef.current.right;
                const timeSinceLastMove = timestamp - lastMoveTimeRef.current.right;
                
                // Only auto-repeat after DAS delay has passed
                if (timeSincePress >= DAS_DELAY && timeSinceLastMove >= ARR_DELAY) {
                    if (gameRef.current.moveRight()) {
                        sounds.playMove();
                        needsUpdate = true;
                    }
                    lastMoveTimeRef.current.right = timestamp;
                }
            }

            if (keysPressed.current.has('ArrowDown')) {
                const timeSincePress = timestamp - keyPressStartRef.current.down;
                const timeSinceLastMove = timestamp - lastMoveTimeRef.current.down;
                
                // Only auto-repeat after DAS delay has passed
                if (timeSincePress >= DAS_DELAY && timeSinceLastMove >= ARR_DELAY) {
                    if (gameRef.current.moveDown()) {
                        needsUpdate = true;
                    }
                    lastMoveTimeRef.current.down = timestamp;
                }
            }

            // Auto drop pieces
            const dropInterval = getDropInterval(state.level);
            
            if (timestamp - lastDropTimeRef.current >= dropInterval) {
                const oldPiece = gameRef.current.currentPiece;
                
                // Check if piece can move down
                const canMoveDown = oldPiece && !gameRef.current.checkCollision(oldPiece, 0, 1);
                
                // If piece can't move down, it will lock - check for complete lines BEFORE update
                let linesToClear = [];
                if (!canMoveDown && oldPiece) {
                    // Temporarily lock the piece to check what lines would be complete
                    const tempGrid = JSON.parse(JSON.stringify(gameRef.current.grid));
                    const shape = oldPiece.getShape();
                    for (let y = 0; y < 4; y++) {
                        for (let x = 0; x < 4; x++) {
                            if (shape[y][x]) {
                                const gridX = oldPiece.x + x;
                                const gridY = oldPiece.y + y;
                                if (gridY >= 0 && gridY < 20 && gridX >= 0 && gridX < 10) {
                                    tempGrid[gridY][gridX] = oldPiece.type;
                                }
                            }
                        }
                    }
                    // Check which lines are complete in temp grid
                    for (let y = 0; y < 20; y++) {
                        let isComplete = true;
                        for (let x = 0; x < 10; x++) {
                            if (tempGrid[y][x] === 0) {
                                isComplete = false;
                                break;
                            }
                        }
                        if (isComplete) {
                            linesToClear.push(y);
                        }
                    }
                }
                
                gameRef.current.update();
                const newPiece = gameRef.current.currentPiece;
                
                // If piece changed, it means the old piece was locked
                if (oldPiece && newPiece && oldPiece !== newPiece) {
                    sounds.playLock();
                    
                    // Show line clear animation if lines were detected
                    if (linesToClear.length > 0) {
                        console.log('Lines to clear:', linesToClear);
                        setClearingLines(linesToClear);
                        setTimeout(() => {
                            console.log('Clearing animation');
                            setClearingLines([]);
                        }, 500); // Increased to 500ms to make it more visible
                    }
                }
                
                needsUpdate = true;
                lastDropTimeRef.current = timestamp;
            }

            // Update state if anything changed
            if (needsUpdate) {
                updateGameState();
                needsUpdate = false;
            }

            animationFrameRef.current = requestAnimationFrame(gameLoop);
        };

        // Initialize lastDropTime
        lastDropTimeRef.current = performance.now();

        animationFrameRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isGameActive, getDropInterval, updateGameState]);

    // Start game
    const startGame = useCallback(() => {
        // Create game instance only when starting
        if (gameSeedRef.current) {
            gameRef.current = new TetrisGame(gameSeedRef.current);
        } else {
            gameRef.current = new TetrisGame();
        }
        
        gameRef.current.start();
        updateGameState();
        setIsGameActive(true); // Activate game loop
        console.log('Game started, state:', gameRef.current.getState());
    }, [updateGameState]);

    // Pause/unpause game
    const togglePause = useCallback(() => {
        if (gameRef.current) {
            gameRef.current.togglePause();
            updateGameState();
        }
    }, [updateGameState]);

    // Move left
    const moveLeft = useCallback(() => {
        if (gameRef.current && gameRef.current.moveLeft()) {
            sounds.playMove();
            updateGameState();
        }
    }, [updateGameState, sounds]);

    // Move right
    const moveRight = useCallback(() => {
        if (gameRef.current && gameRef.current.moveRight()) {
            sounds.playMove();
            updateGameState();
        }
    }, [updateGameState, sounds]);

    // Rotate
    const rotate = useCallback(() => {
        if (gameRef.current && gameRef.current.rotate()) {
            sounds.playRotate();
            updateGameState();
        }
    }, [updateGameState, sounds]);

    // Soft drop
    const softDrop = useCallback(() => {
        if (gameRef.current && gameRef.current.moveDown()) {
            sounds.playSoftDrop();
            updateGameState();
        }
    }, [updateGameState, sounds]);

    // Hard drop
    const hardDrop = useCallback(() => {
        if (gameRef.current) {
            const oldPiece = gameRef.current.currentPiece;
            
            // Check for complete lines BEFORE clearing
            if (oldPiece) {
                // Simulate locking the piece after hard drop
                gameRef.current.hardDrop();
                const tempGrid = JSON.parse(JSON.stringify(gameRef.current.grid));
                const shape = oldPiece.getShape();
                for (let y = 0; y < 4; y++) {
                    for (let x = 0; x < 4; x++) {
                        if (shape[y][x]) {
                            const gridX = oldPiece.x + x;
                            const gridY = oldPiece.y + y;
                            if (gridY >= 0 && gridY < 20 && gridX >= 0 && gridX < 10) {
                                tempGrid[gridY][gridX] = oldPiece.type;
                            }
                        }
                    }
                }
                
                // Check which lines are complete
                const linesToClear = [];
                for (let y = 0; y < 20; y++) {
                    let isComplete = true;
                    for (let x = 0; x < 10; x++) {
                        if (tempGrid[y][x] === 0) {
                            isComplete = false;
                            break;
                        }
                    }
                    if (isComplete) {
                        linesToClear.push(y);
                    }
                }
                
                sounds.playHardDrop();
                gameRef.current.update(); // Lock piece and spawn new one
                sounds.playLock();
                
                // Show line clear animation
                if (linesToClear.length > 0) {
                    console.log('Hard drop - Lines to clear:', linesToClear);
                    setClearingLines(linesToClear);
                    setTimeout(() => {
                        console.log('Clearing animation');
                        setClearingLines([]);
                    }, 500);
                }
            }
            
            updateGameState();
        }
    }, [updateGameState, sounds]);

    // Hold piece
    const holdPiece = useCallback(() => {
        if (gameRef.current && gameRef.current.holdCurrentPiece()) {
            sounds.playHold();
            updateGameState();
        }
    }, [updateGameState, sounds]);

    // Keyboard controls - track key down/up for smooth movement
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (gameState.isGameOver) return;

            // Prevent default for game keys
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyP', 'KeyC'].includes(event.code)) {
                event.preventDefault();
            }

            // Handle one-time actions (rotation, hard drop, etc.)
            switch (event.code) {
                case 'ArrowUp':
                    if (!keysPressed.current.has('ArrowUp')) {
                        rotate();
                        keysPressed.current.add('ArrowUp');
                    }
                    break;
                case 'Space':
                    if (!keysPressed.current.has('Space')) {
                        hardDrop();
                        keysPressed.current.add('Space');
                    }
                    break;
                case 'KeyP':
                    if (!keysPressed.current.has('KeyP')) {
                        togglePause();
                        keysPressed.current.add('KeyP');
                    }
                    break;
                case 'KeyC':
                    if (!keysPressed.current.has('KeyC')) {
                        holdPiece();
                        keysPressed.current.add('KeyC');
                    }
                    break;
                case 'ArrowLeft':
                    if (!keysPressed.current.has('ArrowLeft')) {
                        moveLeft();
                        const now = performance.now();
                        keyPressStartRef.current.left = now; // Track when key was first pressed
                        lastMoveTimeRef.current.left = now;
                        keysPressed.current.add('ArrowLeft');
                    }
                    break;
                case 'ArrowRight':
                    if (!keysPressed.current.has('ArrowRight')) {
                        moveRight();
                        const now = performance.now();
                        keyPressStartRef.current.right = now; // Track when key was first pressed
                        lastMoveTimeRef.current.right = now;
                        keysPressed.current.add('ArrowRight');
                    }
                    break;
                case 'ArrowDown':
                    if (!keysPressed.current.has('ArrowDown')) {
                        softDrop();
                        const now = performance.now();
                        keyPressStartRef.current.down = now; // Track when key was first pressed
                        lastMoveTimeRef.current.down = now;
                        keysPressed.current.add('ArrowDown');
                    }
                    break;
                default:
                    break;
            }
        };

        const handleKeyUp = (event) => {
            keysPressed.current.delete(event.code);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState.isGameOver, moveLeft, moveRight, rotate, softDrop, hardDrop, togglePause, holdPiece]);

    return {
        gameState,
        renderTrigger,
        clearingLines,
        startGame,
        togglePause,
        moveLeft,
        moveRight,
        rotate,
        softDrop,
        hardDrop
    };
};
