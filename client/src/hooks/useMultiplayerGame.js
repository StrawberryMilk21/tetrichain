import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from './useGame.js';
import { TetrisGame } from '../game.js';

/**
 * Custom hook for managing multiplayer Tetris game state
 * Extends useGame with WebSocket synchronization
 */
export function useMultiplayerGame(socket, roomId, isActive) {
  const localGame = useGame(null); // Local game instance
  const [opponentGameState, setOpponentGameState] = useState({
    grid: [],
    currentPiece: null,
    score: 0,
    linesCleared: 0,
    level: 1,
    isGameOver: false,
    nextQueue: [],
    holdPiece: null,
    piecesPlaced: 0,
  });
  const [incomingGarbageLines, setIncomingGarbageLines] = useState(0);
  const [isLocalGameOver, setIsLocalGameOver] = useState(false);
  
  const lastSyncTimeRef = useRef(0);
  const syncIntervalRef = useRef(null);
  const pendingGarbageRef = useRef(0);

  // Sync local game state to server
  const syncGameState = useCallback(() => {
    if (!socket || !roomId || !isActive) return;

    const now = Date.now();
    // Throttle sync to every 100ms
    if (now - lastSyncTimeRef.current < 100) return;

    const stateUpdate = {
      roomId,
      state: {
        playerId: socket.id,
        grid: localGame.gameState.grid,
        currentPiece: localGame.gameState.currentPiece,
        score: localGame.gameState.score,
        linesCleared: localGame.gameState.linesCleared,
        timestamp: now,
      },
    };

    socket.emit('game:state_update', stateUpdate);
    lastSyncTimeRef.current = now;
  }, [socket, roomId, isActive, localGame.gameState]);

  // Handle opponent state updates
  useEffect(() => {
    if (!socket || !isActive) return;

    const handleOpponentStateUpdate = (stateUpdate) => {
      setOpponentGameState(prev => ({
        ...prev,
        grid: stateUpdate.grid || prev.grid,
        currentPiece: stateUpdate.currentPiece || prev.currentPiece,
        score: stateUpdate.score || prev.score,
        linesCleared: stateUpdate.linesCleared || prev.linesCleared,
      }));
    };

    socket.on('game:state_update', handleOpponentStateUpdate);

    return () => {
      socket.off('game:state_update', handleOpponentStateUpdate);
    };
  }, [socket, isActive]);

  // Handle opponent moves
  useEffect(() => {
    if (!socket || !isActive) return;

    const handleOpponentMove = (data) => {
      // Update opponent's piece position visually
      // This is for real-time feedback
    };

    const handleOpponentRotate = (data) => {
      // Update opponent's piece rotation visually
    };

    const handleOpponentDrop = (data) => {
      // Show opponent dropped piece
    };

    socket.on('game:opponent_move', handleOpponentMove);
    socket.on('game:opponent_rotate', handleOpponentRotate);
    socket.on('game:opponent_drop', handleOpponentDrop);

    return () => {
      socket.off('game:opponent_move', handleOpponentMove);
      socket.off('game:opponent_rotate', handleOpponentRotate);
      socket.off('game:opponent_drop', handleOpponentDrop);
    };
  }, [socket, isActive]);

  // Handle garbage lines
  useEffect(() => {
    if (!socket || !isActive) return;

    const handleGarbageIncoming = (garbageEvent) => {
      const { lines } = garbageEvent;
      setIncomingGarbageLines(prev => prev + lines);
      pendingGarbageRef.current += lines;

      // Apply garbage after a short delay (visual warning)
      setTimeout(() => {
        applyGarbageLines(lines);
        setIncomingGarbageLines(prev => Math.max(0, prev - lines));
        pendingGarbageRef.current = Math.max(0, pendingGarbageRef.current - lines);
      }, 1000);
    };

    socket.on('game:garbage_incoming', handleGarbageIncoming);

    return () => {
      socket.off('game:garbage_incoming', handleGarbageIncoming);
    };
  }, [socket, isActive]);

  // Apply garbage lines to local game
  const applyGarbageLines = useCallback((numLines) => {
    if (!localGame.gameRef?.current) return;

    // Add garbage lines to the bottom of the grid
    localGame.gameRef.current.addGarbageLines(numLines);
  }, [localGame]);

  // Send lines cleared to opponent
  const prevLinesClearedRef = useRef(0);
  
  useEffect(() => {
    if (!socket || !roomId || !isActive) return;

    // Check if lines were cleared
    if (localGame.gameState.linesCleared > prevLinesClearedRef.current) {
      const linesCleared = localGame.gameState.linesCleared - prevLinesClearedRef.current;
      
      // Calculate garbage lines to send
      const garbageLines = TetrisGame.calculateGarbageLines(linesCleared);
      
      if (garbageLines > 0) {
        socket.emit('game:lines_cleared', {
          roomId,
          lines: garbageLines,
        });
      }
    }

    prevLinesClearedRef.current = localGame.gameState.linesCleared;
  }, [socket, roomId, isActive, localGame.gameState.linesCleared]);

  // Detect local game over
  useEffect(() => {
    if (!socket || !roomId || !isActive) return;

    if (localGame.gameState.isGameOver && !isLocalGameOver) {
      setIsLocalGameOver(true);
      
      // Notify server of game over
      socket.emit('game:over', { roomId });
    }
  }, [socket, roomId, isActive, localGame.gameState.isGameOver, isLocalGameOver]);

  // Periodic state sync
  useEffect(() => {
    if (!isActive) return;

    syncIntervalRef.current = setInterval(() => {
      syncGameState();
    }, 200); // Sync every 200ms

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isActive, syncGameState]);

  // Send move events to server
  const sendMove = useCallback((direction) => {
    if (!socket || !roomId || !isActive) return;
    
    socket.emit('game:move', {
      roomId,
      direction,
    });
  }, [socket, roomId, isActive]);

  const sendRotate = useCallback((direction) => {
    if (!socket || !roomId || !isActive) return;
    
    socket.emit('game:rotate', {
      roomId,
      direction,
    });
  }, [socket, roomId, isActive]);

  const sendDrop = useCallback(() => {
    if (!socket || !roomId || !isActive) return;
    
    socket.emit('game:drop', {
      roomId,
    });
  }, [socket, roomId, isActive]);

  return {
    // Local game state and controls
    localGameState: localGame.gameState,
    localGameControls: {
      startGame: localGame.startGame,
      togglePause: localGame.togglePause,
      resetGame: localGame.resetGame,
    },
    renderTrigger: localGame.renderTrigger,
    clearingLines: localGame.clearingLines,
    
    // Opponent state
    opponentGameState,
    
    // Garbage lines
    incomingGarbageLines,
    
    // Multiplayer controls
    sendMove,
    sendRotate,
    sendDrop,
    
    // Game status
    isLocalGameOver,
  };
}
