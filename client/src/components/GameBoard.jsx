import React, { useRef, useEffect, useState } from 'react';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 30;

const PIECE_COLORS = {
    0: '#000000',
    1: '#00f0f0', // I - Cyan
    2: '#f0f000', // O - Yellow
    3: '#a000f0', // T - Purple
    4: '#00f000', // S - Green
    5: '#f00000', // Z - Red
    6: '#0000f0', // J - Blue
    7: '#f0a000'  // L - Orange
};

/**
 * Get piece shape from PIECE_SHAPES based on type and rotation
 * This allows us to render pieces that don't have the .getShape() method
 */
const PIECE_SHAPES = {
    1: [ // I
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
        [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
        [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
    ],
    2: [ // O
        [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]
    ],
    3: [ // T
        [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,1,0,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,1,0,0]],
        [[0,0,0,0],[0,1,0,0],[1,1,0,0],[0,1,0,0]]
    ],
    4: [ // S
        [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,0,0,0],[0,1,1,0],[1,1,0,0]],
        [[0,0,0,0],[1,0,0,0],[1,1,0,0],[0,1,0,0]]
    ],
    5: [ // Z
        [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,0,1,0],[0,1,1,0],[0,1,0,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,0,0],[0,1,1,0]],
        [[0,0,0,0],[0,1,0,0],[1,1,0,0],[1,0,0,0]]
    ],
    6: [ // J
        [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,1,0],[0,1,0,0],[0,1,0,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,0,1,0]],
        [[0,0,0,0],[0,1,0,0],[0,1,0,0],[1,1,0,0]]
    ],
    7: [ // L
        [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]],
        [[0,0,0,0],[0,1,0,0],[0,1,0,0],[0,1,1,0]],
        [[0,0,0,0],[0,0,0,0],[1,1,1,0],[1,0,0,0]],
        [[0,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,0,0]]
    ]
};

/**
 * Get shape for a piece (works with both class instances and plain objects)
 */
const getPieceShape = (piece) => {
    if (!piece) return null;
    
    // If piece has getShape method, use it
    if (piece.getShape) {
        return piece.getShape();
    }
    
    // Otherwise, look up shape from PIECE_SHAPES
    if (piece.type && piece.rotation !== undefined) {
        return PIECE_SHAPES[piece.type]?.[piece.rotation] || null;
    }
    
    return null;
};

const GameBoard = ({ grid, currentPiece, ghostPiece, isPaused, renderTrigger, clearingLines = [], skinColors = null }) => {
    const canvasRef = useRef(null);
    const [animationProgress, setAnimationProgress] = useState(0);
    const animationFrameRef = useRef(null);
    
    // Use skin colors if provided, otherwise use default
    const colors = skinColors || PIECE_COLORS;

    // Animate line clear effect
    useEffect(() => {
        if (clearingLines.length > 0) {
            console.log('GameBoard rendering with clearing lines:', clearingLines);
            const startTime = performance.now();
            const duration = 300; // 500ms animation

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                setAnimationProgress(progress);

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    setAnimationProgress(0);
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        } else {
            setAnimationProgress(0);
        }
    }, [clearingLines]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Clear canvas with dark background
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines first
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.15)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= GRID_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
            ctx.stroke();
        }

        // Draw locked pieces (grid)
        if (grid && grid.length > 0) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    const cellValue = grid[y]?.[x] || 0;
                    
                    if (cellValue !== 0) {
                        const color = PIECE_COLORS[cellValue] || PIECE_COLORS[0];
                        const isClearing = clearingLines.includes(y);
                        
                        if (isClearing && animationProgress > 0) {
                            // Simple white flash
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(
                                x * CELL_SIZE + 1,
                                y * CELL_SIZE + 1,
                                CELL_SIZE - 2,
                                CELL_SIZE - 2
                            );
                            
                            // Bright glowing border
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                            ctx.lineWidth = 3;
                            ctx.strokeRect(
                                x * CELL_SIZE + 2,
                                y * CELL_SIZE + 2,
                                CELL_SIZE - 4,
                                CELL_SIZE - 4
                            );
                        } else {
                            // Normal rendering
                            ctx.fillStyle = color;
                            ctx.fillRect(
                                x * CELL_SIZE + 1,
                                y * CELL_SIZE + 1,
                                CELL_SIZE - 2,
                                CELL_SIZE - 2
                            );
                            
                            // Add inner border for depth
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(
                                x * CELL_SIZE + 2,
                                y * CELL_SIZE + 2,
                                CELL_SIZE - 4,
                                CELL_SIZE - 4
                            );
                        }
                    }
                }
            }
        }

        // Draw ghost piece (shadow) - shows where piece will land
        if (ghostPiece && currentPiece) {
            const shape = getPieceShape(ghostPiece);
            if (shape) {
                const color = PIECE_COLORS[ghostPiece.type];
            
                for (let y = 0; y < 4; y++) {
                    for (let x = 0; x < 4; x++) {
                        if (shape[y][x]) {
                            const gridX = ghostPiece.x + x;
                            const gridY = ghostPiece.y + y;
                            
                            if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                                // Draw semi-transparent ghost piece
                                ctx.fillStyle = color + '30'; // Add alpha for transparency
                                ctx.fillRect(
                                    gridX * CELL_SIZE + 1,
                                    gridY * CELL_SIZE + 1,
                                    CELL_SIZE - 2,
                                    CELL_SIZE - 2
                                );
                                
                                // Draw outline only
                                ctx.strokeStyle = color + '80'; // Semi-transparent outline
                                ctx.lineWidth = 2;
                                ctx.strokeRect(
                                    gridX * CELL_SIZE + 2,
                                    gridY * CELL_SIZE + 2,
                                    CELL_SIZE - 4,
                                    CELL_SIZE - 4
                                );
                            }
                        }
                    }
                }
            }
        }

        // Draw current falling piece (on top of ghost)
        if (currentPiece) {
            const shape = getPieceShape(currentPiece);
            if (shape) {
                const color = PIECE_COLORS[currentPiece.type];
            
                for (let y = 0; y < 4; y++) {
                    for (let x = 0; x < 4; x++) {
                        if (shape[y][x]) {
                            const gridX = currentPiece.x + x;
                            const gridY = currentPiece.y + y;
                            
                            if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
                                // Fill cell
                                ctx.fillStyle = color;
                                ctx.fillRect(
                                    gridX * CELL_SIZE + 1,
                                    gridY * CELL_SIZE + 1,
                                    CELL_SIZE - 2,
                                    CELL_SIZE - 2
                                );
                                
                                // Add inner border for depth
                                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                                ctx.lineWidth = 2;
                                ctx.strokeRect(
                                    gridX * CELL_SIZE + 2,
                                    gridY * CELL_SIZE + 2,
                                    CELL_SIZE - 4,
                                    CELL_SIZE - 4
                                );
                            }
                        }
                    }
                }
            }
        }
    }, [grid, currentPiece, ghostPiece, renderTrigger, clearingLines, animationProgress]);

    // Calculate screen shake offset
    const shakeIntensity = clearingLines.length > 0 && animationProgress > 0 ? 
        Math.sin(animationProgress * Math.PI * 10) * (5 * clearingLines.length) * (1 - animationProgress) : 0;
    
    return (
        <div style={{ position: 'relative' }}>
            <canvas 
                ref={canvasRef}
                width={GRID_WIDTH * CELL_SIZE}
                height={GRID_HEIGHT * CELL_SIZE}
                id="gameCanvas"
                style={{
                    transform: `translate(${shakeIntensity}px, ${shakeIntensity * 0.5}px)`,
                    transition: clearingLines.length === 0 ? 'transform 0.1s ease-out' : 'none'
                }}
            />
            {isPaused && (
                <div className="pause-overlay">
                    <h2>PAUSED</h2>
                    <p>Press P to resume</p>
                </div>
            )}
        </div>
    );
};

export default GameBoard;
