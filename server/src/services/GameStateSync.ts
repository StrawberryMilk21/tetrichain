import { SocketManager } from './SocketManager';
import { RoomManager } from './RoomManager';
import { logger } from '../utils/logger';
import { GameStateUpdate, GarbageEvent } from '../models/BattleRoom';

export class GameStateSync {
  private socketManager: SocketManager;
  private roomManager: RoomManager;

  constructor(socketManager: SocketManager, roomManager: RoomManager) {
    this.socketManager = socketManager;
    this.roomManager = roomManager;
  }

  /**
   * Calculate garbage lines based on lines cleared
   * 1 line = 0 garbage
   * 2 lines = 1 garbage
   * 3 lines = 2 garbage
   * 4 lines (Tetris) = 4 garbage
   */
  private calculateGarbageLines(linesCleared: number): number {
    switch (linesCleared) {
      case 1:
        return 0;
      case 2:
        return 1;
      case 3:
        return 2;
      case 4:
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Handle piece movement
   */
  async handleMove(
    roomId: string,
    walletAddress: string,
    moveData: { direction: 'left' | 'right' | 'down' }
  ): Promise<void> {
    try {
      const room = await this.roomManager.getRoom(roomId);
      if (!room || room.status !== 'active') {
        return;
      }

      // Get opponent address
      const opponentAddress = room.player1.address === walletAddress
        ? room.player2?.address
        : room.player1.address;

      if (!opponentAddress) {
        return;
      }

      // Broadcast move to opponent
      const timestamp = Date.now();
      this.socketManager.emitToPlayer(opponentAddress, 'game:opponent_move', {
        direction: moveData.direction,
        timestamp,
      });

      logger.debug('Move broadcasted', { roomId, walletAddress, direction: moveData.direction });

    } catch (error) {
      logger.error('Error handling move', { error, roomId, walletAddress });
    }
  }

  /**
   * Handle piece rotation
   */
  async handleRotate(
    roomId: string,
    walletAddress: string,
    rotateData: { direction: 'cw' | 'ccw' }
  ): Promise<void> {
    try {
      const room = await this.roomManager.getRoom(roomId);
      if (!room || room.status !== 'active') {
        return;
      }

      // Get opponent address
      const opponentAddress = room.player1.address === walletAddress
        ? room.player2?.address
        : room.player1.address;

      if (!opponentAddress) {
        return;
      }

      // Broadcast rotation to opponent
      const timestamp = Date.now();
      this.socketManager.emitToPlayer(opponentAddress, 'game:opponent_rotate', {
        direction: rotateData.direction,
        timestamp,
      });

      logger.debug('Rotation broadcasted', { roomId, walletAddress, direction: rotateData.direction });

    } catch (error) {
      logger.error('Error handling rotation', { error, roomId, walletAddress });
    }
  }

  /**
   * Handle hard drop
   */
  async handleDrop(
    roomId: string,
    walletAddress: string
  ): Promise<void> {
    try {
      const room = await this.roomManager.getRoom(roomId);
      if (!room || room.status !== 'active') {
        return;
      }

      // Get opponent address
      const opponentAddress = room.player1.address === walletAddress
        ? room.player2?.address
        : room.player1.address;

      if (!opponentAddress) {
        return;
      }

      // Broadcast drop to opponent
      const timestamp = Date.now();
      this.socketManager.emitToPlayer(opponentAddress, 'game:opponent_drop', {
        timestamp,
      });

      logger.debug('Drop broadcasted', { roomId, walletAddress });

    } catch (error) {
      logger.error('Error handling drop', { error, roomId, walletAddress });
    }
  }

  /**
   * Handle game state update
   */
  async handleStateUpdate(
    roomId: string,
    walletAddress: string,
    stateUpdate: GameStateUpdate
  ): Promise<void> {
    try {
      const room = await this.roomManager.getRoom(roomId);
      if (!room || room.status !== 'active') {
        return;
      }

      // Get opponent address
      const opponentAddress = room.player1.address === walletAddress
        ? room.player2?.address
        : room.player1.address;

      if (!opponentAddress) {
        return;
      }

      // Add timestamp
      stateUpdate.timestamp = Date.now();

      // Broadcast state to opponent within 100ms target
      this.socketManager.emitToPlayer(opponentAddress, 'game:state_update', stateUpdate);

      logger.debug('State update broadcasted', { roomId, walletAddress, score: stateUpdate.score });

    } catch (error) {
      logger.error('Error handling state update', { error, roomId, walletAddress });
    }
  }

  /**
   * Handle lines cleared and send garbage
   */
  async handleLinesCleared(
    roomId: string,
    walletAddress: string,
    linesCleared: number
  ): Promise<void> {
    try {
      const room = await this.roomManager.getRoom(roomId);
      if (!room || room.status !== 'active') {
        return;
      }

      // Get opponent address
      const opponentAddress = room.player1.address === walletAddress
        ? room.player2?.address
        : room.player1.address;

      if (!opponentAddress) {
        return;
      }

      // Calculate garbage lines
      const garbageLines = this.calculateGarbageLines(linesCleared);

      if (garbageLines > 0) {
        const garbageEvent: GarbageEvent = {
          fromPlayer: walletAddress,
          toPlayer: opponentAddress,
          lines: garbageLines,
          timestamp: Date.now(),
        };

        // Send garbage to opponent
        this.socketManager.emitToPlayer(opponentAddress, 'game:garbage_incoming', garbageEvent);

        logger.info('Garbage sent', {
          roomId,
          from: walletAddress,
          to: opponentAddress,
          lines: garbageLines,
          clearedLines: linesCleared,
        });
      }

    } catch (error) {
      logger.error('Error handling lines cleared', { error, roomId, walletAddress });
    }
  }

  /**
   * Handle game over
   */
  async handleGameOver(
    roomId: string,
    loserAddress: string
  ): Promise<void> {
    try {
      const room = await this.roomManager.getRoom(roomId);
      if (!room || room.status !== 'active') {
        return;
      }

      // Determine winner
      const winnerAddress = room.player1.address === loserAddress
        ? room.player2?.address
        : room.player1.address;

      if (!winnerAddress) {
        logger.error('Cannot determine winner', { roomId, loserAddress });
        return;
      }

      // Update room status
      room.status = 'ended';
      await this.roomManager.updateRoom(room);

      // Calculate battle duration
      const duration = room.startTime ? Date.now() - room.startTime : 0;

      // Emit game end to both players
      this.socketManager.emitToRoom(roomId, 'game:end', {
        winner: winnerAddress,
        loser: loserAddress,
        duration,
        wager: room.wager,
      });

      logger.info('Game ended', {
        roomId,
        winner: winnerAddress,
        loser: loserAddress,
        duration,
      });

      // Clean up room after a delay
      setTimeout(async () => {
        await this.roomManager.deleteRoom(roomId);
      }, 30000); // 30 seconds

    } catch (error) {
      logger.error('Error handling game over', { error, roomId, loserAddress });
    }
  }

  /**
   * Setup event handlers for game state sync
   */
  setupEventHandlers(): void {
    const io = this.socketManager.getIO();

    io.on('connection', (socket) => {
      const socketWithWallet = socket as any;
      
      // Movement events
      socket.on('game:move', async (data: { roomId: string; direction: 'left' | 'right' | 'down' }) => {
        if (socketWithWallet.walletAddress) {
          await this.handleMove(data.roomId, socketWithWallet.walletAddress, { direction: data.direction });
        }
      });

      // Rotation events
      socket.on('game:rotate', async (data: { roomId: string; direction: 'cw' | 'ccw' }) => {
        if (socketWithWallet.walletAddress) {
          await this.handleRotate(data.roomId, socketWithWallet.walletAddress, { direction: data.direction });
        }
      });

      // Drop events
      socket.on('game:drop', async (data: { roomId: string }) => {
        if (socketWithWallet.walletAddress) {
          await this.handleDrop(data.roomId, socketWithWallet.walletAddress);
        }
      });

      // State update events
      socket.on('game:state_update', async (data: { roomId: string; state: GameStateUpdate }) => {
        if (socketWithWallet.walletAddress) {
          await this.handleStateUpdate(data.roomId, socketWithWallet.walletAddress, data.state);
        }
      });

      // Lines cleared events
      socket.on('game:lines_cleared', async (data: { roomId: string; lines: number }) => {
        if (socketWithWallet.walletAddress) {
          await this.handleLinesCleared(data.roomId, socketWithWallet.walletAddress, data.lines);
        }
      });

      // Game over events
      socket.on('game:over', async (data: { roomId: string }) => {
        if (socketWithWallet.walletAddress) {
          await this.handleGameOver(data.roomId, socketWithWallet.walletAddress);
        }
      });
    });

    logger.info('GameStateSync event handlers registered');
  }
}
