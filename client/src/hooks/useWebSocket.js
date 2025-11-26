import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// WebSocket server URL - update this based on your deployment
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

// Reconnection configuration
const RECONNECTION_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 1.5,
};

export function useWebSocket(walletAddress, username) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const eventHandlersRef = useRef(new Map());

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    if (!walletAddress || !username) {
      console.warn('Cannot connect: missing wallet address or username');
      return;
    }

    try {
      const newSocket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: RECONNECTION_CONFIG.maxAttempts,
        reconnectionDelay: RECONNECTION_CONFIG.initialDelay,
        reconnectionDelayMax: RECONNECTION_CONFIG.maxDelay,
        timeout: 20000,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempt(0);

        // Authenticate with server
        newSocket.emit('auth', {
          walletAddress,
          username,
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);

        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          handleReconnect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      newSocket.on('auth:success', (data) => {
        console.log('Authentication successful:', data);
      });

      newSocket.on('auth:error', (data) => {
        console.error('Authentication error:', data);
        setConnectionError(data.message);
      });

      // Re-attach any existing event handlers
      eventHandlersRef.current.forEach((handler, event) => {
        newSocket.on(event, handler);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create socket:', error);
      setConnectionError(error.message);
    }
  }, [walletAddress, username]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Handle reconnection with exponential backoff
  const handleReconnect = useCallback(() => {
    if (reconnectAttempt >= RECONNECTION_CONFIG.maxAttempts) {
      console.error('Max reconnection attempts reached');
      setConnectionError('Failed to reconnect after multiple attempts');
      return;
    }

    const delay = Math.min(
      RECONNECTION_CONFIG.initialDelay * Math.pow(RECONNECTION_CONFIG.backoffMultiplier, reconnectAttempt),
      RECONNECTION_CONFIG.maxDelay
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1}/${RECONNECTION_CONFIG.maxAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempt(prev => prev + 1);
      connect();
    }, delay);
  }, [reconnectAttempt, connect]);

  // Emit event to server
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`);
      return false;
    }
  }, []);

  // Register event listener
  const on = useCallback((event, handler) => {
    // Store handler for re-attachment on reconnect
    eventHandlersRef.current.set(event, handler);

    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }

    // Return cleanup function
    return () => {
      eventHandlersRef.current.delete(event);
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  // Remove event listener
  const off = useCallback((event, handler) => {
    eventHandlersRef.current.delete(event);
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  // Connect on mount if credentials are available
  useEffect(() => {
    if (walletAddress && username) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [walletAddress, username, connect, disconnect]);

  return {
    socket,
    isConnected,
    connectionError,
    reconnectAttempt,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}
