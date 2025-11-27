import { useState, useEffect, useRef } from 'react';
import { useGame } from './useGame.js';

/**
 * Hook for managing multiplayer Tetris battle
 * Uses the existing useGame hook for local gameplay
 * Syncs state with opponent via WebSocket
 */
export function useMultiplayerBattle(socket, roomData, opponentData) {
  const [opponentGameState, setOpponentGameState] = useState(null);
  const [opponentRenderTrigger, setOpponentRenderTrigger] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Use room ID as seed so both players get same pieces
  const gameSeed = roomData?.roomId;
  
  // Use the same game hook as solo mode
  const localGame = useGame(gameSeed);
  
  const syncIntervalRef = useRef(null);
  const gameStartedRef = useRef(false);

  // Start the game when room is ready (only once)
  useEffect(() => {
    if (!roomData || !localGame.startGame || gameStartedRef.current) return;

    console.log('🎮 Starting multiplayer battle');
    console.log('🎲 Game seed:', gameSeed);
    console.log('🎲 Room ID:', roomData.roomId);
    
    // Start the game - this activates the game loop in useGame
    localGame.startGame();
    gameStartedRef.current = true;
    
    console.log('✅ Game started, isGameActive:', localGame.isGameActive);
    
    // Log first few pieces to verify determinism
    setTimeout(() => {
      if (localGame.gameState && localGame.gameState.nextQueue) {
        console.log('🎲 First 5 pieces in queue:', localGame.gameState.nextQueue.slice(0, 5));
      }
    }, 500);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      // Stop the game when unmounting
      if (localGame.pauseGame) {
        localGame.pauseGame();
      }
    };
  }, [roomData, localGame, gameSeed]);

  // Sync game state to opponent periodically
  useEffect(() => {
    if (!socket || !roomData || !gameStartedRef.current) return;

    console.log('📡 Starting state sync interval');

    // Send state updates every 150ms (not too frequent to avoid lag)
    let updateCount = 0;
    const interval = setInterval(() => {
      const state = localGame.gameState;
      if (state && !state.isGameOver && !state.isPaused) {
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
            piecesPlaced: state.piecesPlaced || 0,
            ghostPiece: state.ghostPiece,
          },
        });
        updateCount++;
        if (updateCount % 20 === 0) { // Log every 20 updates (~3 seconds)
          console.log('📤 Sent state update #' + updateCount, 'Score:', state.score);
        }
      }
    }, 150);

    syncIntervalRef.current = interval;

    return () => {
      console.log('📡 Stopping state sync interval');
      clearInterval(interval);
    };
  }, [socket, roomData]); // Removed localGame.gameState dependency to prevent restarts

  // Check for game over
  useEffect(() => {
    if (localGame.gameState?.isGameOver && !isGameOver) {
      console.log('😢 Local player lost!');
      setIsGameOver(true);
      setWinner('opponent');
      
      if (socket && roomData) {
        socket.emit('game:over', {
          roomId: roomData.roomId,
          winner: 'opponent',
        });
      }
    }
  }, [localGame.gameState?.isGameOver, isGameOver, socket, roomData]);

  // Listen for opponent's game state
  useEffect(() => {
    if (!socket) {
      console.warn('📡 No socket available for opponent state');
      return;
    }

    console.log('📡 Setting up opponent state listeners, socket connected:', socket.connected);

    const handleOpponentState = (data) => {
      console.log('📡 Received opponent state!', data?.state?.score);
      if (data && data.state) {
        setOpponentGameState(data.state);
        setOpponentRenderTrigger(prev => prev + 1); // Force re-render
      } else {
        console.warn('📡 Received invalid opponent state:', data);
      }
    };

    const handleOpponentGameOver = () => {
      console.log('🎉 Opponent lost! You win!');
      setIsGameOver(true);
      setWinner('local');
    };

    socket.on('game:opponent_state', handleOpponentState);
    socket.on('game:opponent_game_over', handleOpponentGameOver);

    // Test if socket is working
    console.log('📡 Socket event listeners registered');

    return () => {
      console.log('📡 Removing opponent state listeners');
      socket.off('game:opponent_state', handleOpponentState);
      socket.off('game:opponent_game_over', handleOpponentGameOver);
    };
  }, [socket]);



  return {
    localGame,
    localGameState: localGame.gameState,
    opponentGameState,
    opponentRenderTrigger,
    isGameOver,
    winner,
  };
}
