import { useRef, useEffect } from 'react';

const CELL_SIZE = 20;

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

const PIECE_SHAPES = {
    1: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    2: [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
    3: [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]],
    4: [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
    5: [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
    6: [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]],
    7: [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]]
};

const PiecePreview = ({ pieceType, label }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (pieceType && PIECE_SHAPES[pieceType]) {
            const shape = PIECE_SHAPES[pieceType];
            const color = PIECE_COLORS[pieceType];

            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    if (shape[y][x]) {
                        // Fill cell
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            x * CELL_SIZE + 1,
                            y * CELL_SIZE + 1,
                            CELL_SIZE - 2,
                            CELL_SIZE - 2
                        );
                        
                        // Add inner border
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 1;
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
    }, [pieceType]);

    return (
        <div className="piece-preview">
            {label && <div className="piece-preview-label">{label}</div>}
            <canvas 
                ref={canvasRef}
                width={4 * CELL_SIZE}
                height={4 * CELL_SIZE}
                className="piece-preview-canvas"
            />
        </div>
    );
};

export default PiecePreview;
