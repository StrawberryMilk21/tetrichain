import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { SocketManager } from './services/SocketManager';
import { redisClient } from './services/RedisClient';
import { MatchmakingService } from './services/MatchmakingService';
import { RoomManager } from './services/RoomManager';
import { GameStateSync } from './services/GameStateSync';
import { BlockchainService } from './services/BlockchainService';
import { MetricsService } from './services/MetricsService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));
app.use(express.json());

// Initialize services
let socketManager: SocketManager;
let matchmakingService: MatchmakingService;
let roomManager: RoomManager;
let gameStateSync: GameStateSync;
let blockchainService: BlockchainService;
let metricsService: MetricsService;

async function initializeServices() {
  try {
    // Connect to Redis (with fallback to in-memory)
    await redisClient.connect();
    if (redisClient.isUsingInMemory()) {
      logger.warn('⚠️  Running with IN-MEMORY storage (Redis not available)');
      logger.warn('⚠️  Matchmaking state will not persist across server restarts');
      logger.warn('⚠️  For production, enable Redis in your hosting platform');
    } else {
      logger.info('✓ Redis connected');
    }

    // Initialize Metrics Service
    metricsService = new MetricsService();
    logger.info('Metrics service initialized');

    // Initialize Blockchain Service
    blockchainService = new BlockchainService();
    logger.info('Blockchain service initialized');

    // Initialize Socket.IO
    socketManager = new SocketManager(httpServer);
    logger.info('Socket.IO server initialized');

    // Initialize Room Manager
    roomManager = new RoomManager(socketManager);
    logger.info('Room manager initialized');

    // Initialize Game State Sync
    gameStateSync = new GameStateSync(socketManager, roomManager);
    logger.info('Game state sync initialized');

    // Initialize Matchmaking Service
    matchmakingService = new MatchmakingService(socketManager);
    matchmakingService.setRoomManager(roomManager); // Connect RoomManager to MatchmakingService
    logger.info('Matchmaking service initialized');

    // Setup event handlers
    setupEventHandlers();
    gameStateSync.setupEventHandlers();

    // Start metrics collection
    startMetricsCollection();

  } catch (error) {
    logger.error('Failed to initialize services', error);
    process.exit(1);
  }
}

function setupEventHandlers() {
  const io = socketManager.getIO();
  
  io.on('connection', (socket: any) => {
    // Matchmaking events
    socket.on('matchmaking:join', async (data: { wager: number }) => {
      if (socket.walletAddress && socket.username) {
        await matchmakingService.joinQueue(socket.walletAddress, socket.username, data.wager);
      }
    });

    socket.on('matchmaking:cancel', async () => {
      if (socket.walletAddress) {
        await matchmakingService.leaveQueue(socket.walletAddress);
        socket.emit('matchmaking:cancelled');
      }
    });

    // Room events
    socket.on('room:create', async (data: { wager: number; isPrivate?: boolean }) => {
      if (socket.walletAddress && socket.username) {
        const room = await roomManager.createRoom(
          socket.walletAddress,
          socket.username,
          data.wager,
          data.isPrivate || false
        );
        socket.emit('room:created', room);
      }
    });

    socket.on('room:join', async (data: { roomKey: string }) => {
      if (socket.walletAddress && socket.username) {
        const room = await roomManager.joinRoomByKey(
          data.roomKey,
          socket.walletAddress,
          socket.username
        );
        if (room) {
          socket.emit('room:joined', room);
        } else {
          socket.emit('room:error', { message: 'Room not found or full' });
        }
      }
    });

    socket.on('room:ready', async (data: { roomId: string; ready: boolean }) => {
      if (socket.walletAddress) {
        await roomManager.setPlayerReady(data.roomId, socket.walletAddress, data.ready);
      }
    });

    socket.on('room:leave', async (data: { roomId: string }) => {
      if (socket.walletAddress) {
        await roomManager.leaveRoom(data.roomId, socket.walletAddress);
      }
    });

    // Game state synchronization
    socket.on('game:state_update', async (data: { roomId: string; state: any }) => {
      if (!socket.walletAddress) {
        logger.warn('game:state_update without wallet address');
        return;
      }

      const room = await roomManager.getRoom(data.roomId);
      if (!room) {
        logger.warn('game:state_update for non-existent room', { roomId: data.roomId });
        return;
      }

      // Get opponent's wallet address
      const opponentAddress = room.player1.address === socket.walletAddress
        ? room.player2?.address
        : room.player1.address;

      if (opponentAddress) {
        socketManager.emitToPlayer(opponentAddress, 'game:opponent_state', {
          state: data.state,
        });
        
        // Log occasionally
        if (data.state.score % 100 === 0) {
          logger.debug('Relayed game state', { 
            from: socket.walletAddress.substring(0, 10),
            to: opponentAddress.substring(0, 10),
            score: data.state.score 
          });
        }
      } else {
        logger.warn('No opponent found for state update');
      }
    });

    socket.on('game:over', async (data: { roomId: string; winner: string }) => {
      if (!socket.walletAddress) return;

      const room = await roomManager.getRoom(data.roomId);
      if (!room) return;

      // Notify opponent
      const opponentAddress = room.player1.address === socket.walletAddress
        ? room.player2?.address
        : room.player1.address;

      if (opponentAddress) {
        socketManager.emitToPlayer(opponentAddress, 'game:opponent_game_over', {});
      }

      logger.info('Game over', { roomId: data.roomId, winner: data.winner });
    });
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const queueSize = matchmakingService ? await matchmakingService.getQueueSize() : 0;
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connectedPlayers: socketManager ? socketManager.getConnectedCount() : 0,
    matchmakingQueue: queueSize,
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  if (!metricsService) {
    return res.status(503).json({ error: 'Metrics service not initialized' });
  }
  
  const metrics = metricsService.getMetrics();
  res.json({
    ...metrics,
    uptimeFormatted: metricsService.getFormattedUptime(),
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function start() {
  await initializeServices();
  
  httpServer.listen(config.port, () => {
    logger.info(`TetriChain game server started on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

start();

/**
 * Collect and update metrics periodically
 */
function startMetricsCollection() {
  setInterval(async () => {
    if (!metricsService || !socketManager || !matchmakingService) {
      return;
    }

    const queueSize = await matchmakingService.getQueueSize();
    
    metricsService.updateMetrics({
      playersOnline: socketManager.getConnectedCount(),
      matchmakingQueue: queueSize,
    });
  }, 5000); // Update every 5 seconds
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  if (matchmakingService) {
    matchmakingService.stop();
  }
  
  await redisClient.disconnect();
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
