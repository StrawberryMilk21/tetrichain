import { useState, useEffect, useCallback, useRef } from 'react';
import { TetrisGame } from '../game.js';

/**
 * Hook for managing multiplayer Tetris battle
 * Manages local game and syncs with opponent via WebSocket
 */
export function useMultiplayerBattle(socket, roomData, opponentData) {
  const [localGameState, setLocalGameState] = useState(null);
  const [opponentGameState, setOpponentGameState] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const localGameRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize local game
  useEffect(() => {
    if (!roomData) return;

    console.log('🎮 Initializing multiplayer battle');
    
    // Create local game instance
    localGameRef.current = new TetrisGame();
    localGameRef.current.start();

    // Start game loop
    const gameLoop = () => {
      if (localGameRef.current && !isGameOver) {
        const state = localGameRef.current.getState();
        setLocalGameState(state);

        // Check if local player lost
        if (state.isGameOver && !isGameOver) {
          handleGameOver(false); // Local player lost
        }
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (localGameRef.current) {
        localGameRef.current.pause();
      }
    };
  }, [roomData]);

  // Handle keyboard input
  useEffect(() => {
    if (!localGameRef.current || isGameOver) return;

    const handleKeyDown = (e) => {
      const game = localGameRef.current;
      if (!game) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          game.moveLeft();
          emitGameState();
          break;
        case 'ArrowRight':
          e.preventDefault();
          game.moveRight();
          emitGameState();
          break;
        case 'ArrowDown':
          e.preventDefault();
          game.moveDown();
          emitGameState();
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          e.preventDefault();
          game.rotate();
          emitGameState();
          break;
        case ' ':
          e.preventDefault();
          game.hardDrop();
          emitGameState();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          e.preventDefault();
          game.hold();
          emitGameState();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver]);

  // Emit game state to opponent
  const emitGameState = useCallback(() => {
    if (!socket || !localGameRef.current || !roomData) return;

    const state = localGameRef.current.getState();
    socket.emit('game:state_update', {
      roomId: roomData.roomId,
      state: {
        grid: state.grid,
        score: state.score,
        linesCleared: state.linesCleared,
        level: state.level,
        currentPiece: state.currentPiece,
        nextQueue: state.nextQueue,
        holdPiece: state.holdPiece,
      },
    });
  }, [socket, roomData]);

  // Listen for opponent's game state
  useEffect(() => {
    if (!socket) return;

    const handleOpponentState = (data) => {
      setOpponentGameState(data.state);
    };

    const handleOpponentGameOver = () => {
      handleGameOver(true); // Opponent lost, local player wins
    };

    socket.on('game:opponent_state', handleOpponentState);
    socket.on('game:opponent_game_over', handleOpponentGameOver);

    return () => {
      socket.off('game:opponent_state', handleOpponentState);
      socket.off('game:opponent_game_over', handleOpponentGameOver);
    };
  }, [socket]);

  // Handle game over
  const handleGameOver = useCallback((didWin) => {
    setIsGameOver(true);
    setWinner(didWin ? 'local' : 'opponent');

    if (socket && roomData) {
      socket.emit('game:over', {
        roomId: roomData.roomId,
        winner: didWin ? 'local' : 'opponent',
      });
    }

    console.log(didWin ? '🎉 You won!' : '😢 You lost!');
  }, [socket, roomData]);

  return {
    localGameState,
    opponentGameState,
    isGameOver,
    winner,
  };
}
