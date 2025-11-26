import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Battle flow states:
 * - idle: Not in a battle
 * - matchmaking: Searching for opponent
 * - waiting: Waiting for opponent in private room
 * - countdown: 3-2-1-GO countdown
 * - playing: Battle in progress
 * - ended: Battle finished
 */

export function useBattleFlow(socket) {
  const [battleState, setBattleState] = useState('idle');
  const [roomData, setRoomData] = useState(null);
  const [opponentData, setOpponentData] = useState(null);
  const [countdownValue, setCountdownValue] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  
  const matchmakingStartTimeRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Start matchmaking
  const startMatchmaking = useCallback((wager) => {
    if (!socket) return;

    setBattleState('matchmaking');
    matchmakingStartTimeRef.current = Date.now();
    
    socket.emit('matchmaking:join', { wager });
  }, [socket]);

  // Cancel matchmaking
  const cancelMatchmaking = useCallback(() => {
    if (!socket) return;

    socket.emit('matchmaking:cancel');
    setBattleState('idle');
    matchmakingStartTimeRef.current = null;
  }, [socket]);

  // Create private room
  const createPrivateRoom = useCallback((wager) => {
    if (!socket) return;

    setBattleState('waiting');
    socket.emit('room:create', { wager, isPrivate: true });
  }, [socket]);

  // Join private room
  const joinPrivateRoom = useCallback((roomKey) => {
    if (!socket) return;

    setBattleState('waiting');
    socket.emit('room:join', { roomKey });
  }, [socket]);

  // Set player ready
  const setReady = useCallback((ready = true) => {
    if (!socket || !roomData) return;

    socket.emit('room:ready', {
      roomId: roomData.roomId,
      ready,
    });
  }, [socket, roomData]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (!socket || !roomData) return;

    socket.emit('room:leave', { roomId: roomData.roomId });
    setBattleState('idle');
    setRoomData(null);
    setOpponentData(null);
  }, [socket, roomData]);

  // Forfeit battle
  const forfeitBattle = useCallback(() => {
    if (!socket || !roomData) return;

    socket.emit('game:over', { roomId: roomData.roomId });
    // Server will handle declaring the opponent as winner
  }, [socket, roomData]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    // Matchmaking events
    const handleMatchmakingFound = (data) => {
      setOpponentData(data.opponent);
      setRoomData({ wager: data.wager });
      setBattleState('countdown');
      startCountdown();
    };

    const handleMatchmakingTimeout = () => {
      setBattleState('idle');
      matchmakingStartTimeRef.current = null;
    };

    const handleMatchmakingCancelled = () => {
      setBattleState('idle');
      matchmakingStartTimeRef.current = null;
    };

    // Room events
    const handleRoomCreated = (room) => {
      setRoomData(room);
    };

    const handleRoomJoined = (room) => {
      setRoomData(room);
      if (room.player2) {
        setOpponentData({
          address: room.player2.address,
          username: room.player2.username,
        });
      }
    };

    const handlePlayerJoined = (data) => {
      setOpponentData({
        address: data.player.address,
        username: data.player.username,
      });
    };

    const handleRoomError = (data) => {
      console.error('Room error:', data.message);
      setBattleState('idle');
    };

    // Game events
    const handleCountdown = (data) => {
      setCountdownValue(data.count);
    };

    const handleGameStart = (data) => {
      setBattleState('playing');
      setCountdownValue(null);
    };

    const handleGameEnd = (data) => {
      setBattleState('ended');
      setBattleResult({
        winner: data.winner,
        loser: data.loser,
        duration: data.duration,
        wager: data.wager,
      });
    };

    // Register event listeners
    socket.on('matchmaking:found', handleMatchmakingFound);
    socket.on('matchmaking:timeout', handleMatchmakingTimeout);
    socket.on('matchmaking:cancelled', handleMatchmakingCancelled);
    socket.on('room:created', handleRoomCreated);
    socket.on('room:joined', handleRoomJoined);
    socket.on('room:player_joined', handlePlayerJoined);
    socket.on('room:error', handleRoomError);
    socket.on('game:countdown', handleCountdown);
    socket.on('game:start', handleGameStart);
    socket.on('game:end', handleGameEnd);

    return () => {
      socket.off('matchmaking:found', handleMatchmakingFound);
      socket.off('matchmaking:timeout', handleMatchmakingTimeout);
      socket.off('matchmaking:cancelled', handleMatchmakingCancelled);
      socket.off('room:created', handleRoomCreated);
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:player_joined', handlePlayerJoined);
      socket.off('room:error', handleRoomError);
      socket.off('game:countdown', handleCountdown);
      socket.off('game:start', handleGameStart);
      socket.off('game:end', handleGameEnd);
    };
  }, [socket]);

  // Countdown timer
  const startCountdown = useCallback(() => {
    let count = 3;
    setCountdownValue(count);

    countdownIntervalRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownValue(count);
      } else {
        setCountdownValue('GO!');
        clearInterval(countdownIntervalRef.current);
        setTimeout(() => {
          setCountdownValue(null);
        }, 1000);
      }
    }, 1000);
  }, []);

  // Update estimated wait time during matchmaking
  useEffect(() => {
    if (battleState !== 'matchmaking') {
      setEstimatedWaitTime(null);
      return;
    }

    const interval = setInterval(() => {
      if (matchmakingStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - matchmakingStartTimeRef.current) / 1000);
        setEstimatedWaitTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [battleState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Reset battle
  const resetBattle = useCallback(() => {
    setBattleState('idle');
    setRoomData(null);
    setOpponentData(null);
    setCountdownValue(null);
    setBattleResult(null);
    setEstimatedWaitTime(null);
  }, []);

  return {
    // State
    battleState,
    roomData,
    opponentData,
    countdownValue,
    battleResult,
    estimatedWaitTime,
    
    // Actions
    startMatchmaking,
    cancelMatchmaking,
    createPrivateRoom,
    joinPrivateRoom,
    setReady,
    leaveRoom,
    forfeitBattle,
    resetBattle,
  };
}
