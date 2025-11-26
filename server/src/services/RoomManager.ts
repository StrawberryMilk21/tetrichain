import { redisClient } from './RedisClient';
import { logger } from '../utils/logger';
import { SocketManager } from './SocketManager';
import { BattleRoom, Player } from '../models/BattleRoom';
import { randomBytes } from 'crypto';

export class RoomManager {
  private static readonly ROOM_KEY_PREFIX = 'room:';
  private static readonly ROOM_KEY_LENGTH = 6;
  private socketManager: SocketManager;

  constructor(socketManager: SocketManager) {
    this.socketManager = socketManager;
  }

  /**
   * Generate a unique room key
   */
  private generateRoomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    const bytes = randomBytes(RoomManager.ROOM_KEY_LENGTH);
    
    for (let i = 0; i < RoomManager.ROOM_KEY_LENGTH; i++) {
      key += chars[bytes[i] % chars.length];
    }
    
    return key;
  }

  /**
   * Create a new battle room
   */
  async createRoom(
    walletAddress: string,
    username: string,
    wager: number,
    isPrivate: boolean = false
  ): Promise<BattleRoom> {
    try {
      const client = redisClient.getClient();
      const roomId = `room_${Date.now()}_${randomBytes(4).toString('hex')}`;
      const roomKey = isPrivate ? this.generateRoomKey() : undefined;

      const player1: Player = {
        address: walletAddress,
        username,
        socketId: this.socketManager.getSocket(walletAddress)?.id || '',
        ready: false,
      };

      const room: BattleRoom = {
        roomId,
        roomKey,
        player1,
        player2: undefined,
        wager,
        status: 'waiting',
      };

      // Store room in Redis
      const roomDataKey = `${RoomManager.ROOM_KEY_PREFIX}${roomId}`;
      await client.set(roomDataKey, JSON.stringify(room), { EX: 3600 }); // 1 hour expiry

      // If private room, also store by room key for easy lookup
      if (roomKey) {
        await client.set(`${RoomManager.ROOM_KEY_PREFIX}key:${roomKey}`, roomId, { EX: 3600 });
      }

      // Join socket room
      this.socketManager.joinRoom(walletAddress, roomId);

      logger.info('Room created', { roomId, roomKey, walletAddress, isPrivate });

      return room;

    } catch (error) {
      logger.error('Error creating room', { error, walletAddress });
      throw error;
    }
  }

  /**
   * Join an existing room by room key
   */
  async joinRoomByKey(
    roomKey: string,
    walletAddress: string,
    username: string
  ): Promise<BattleRoom | null> {
    try {
      const client = redisClient.getClient();

      // Get room ID from room key
      const roomId = await client.get(`${RoomManager.ROOM_KEY_PREFIX}key:${roomKey}`);
      if (!roomId) {
        logger.warn('Room key not found', { roomKey });
        return null;
      }

      return await this.joinRoom(roomId, walletAddress, username);

    } catch (error) {
      logger.error('Error joining room by key', { error, roomKey, walletAddress });
      return null;
    }
  }

  /**
   * Join an existing room by room ID
   */
  async joinRoom(
    roomId: string,
    walletAddress: string,
    username: string
  ): Promise<BattleRoom | null> {
    try {
      const client = redisClient.getClient();
      const roomDataKey = `${RoomManager.ROOM_KEY_PREFIX}${roomId}`;

      // Get room data
      const roomData = await client.get(roomDataKey);
      if (!roomData) {
        logger.warn('Room not found', { roomId });
        return null;
      }

      const room: BattleRoom = JSON.parse(roomData);

      // Check if room is full
      if (room.player2) {
        logger.warn('Room is full', { roomId });
        return null;
      }

      // Check if player is already in room
      if (room.player1.address === walletAddress) {
        logger.warn('Player already in room', { roomId, walletAddress });
        return room;
      }

      // Add player 2
      const player2: Player = {
        address: walletAddress,
        username,
        socketId: this.socketManager.getSocket(walletAddress)?.id || '',
        ready: false,
      };

      room.player2 = player2;

      // Update room in Redis
      await client.set(roomDataKey, JSON.stringify(room), { EX: 3600 });

      // Join socket room
      this.socketManager.joinRoom(walletAddress, roomId);

      logger.info('Player joined room', { roomId, walletAddress });

      // Notify both players
      this.socketManager.emitToRoom(roomId, 'room:player_joined', {
        player: player2,
      });

      return room;

    } catch (error) {
      logger.error('Error joining room', { error, roomId, walletAddress });
      return null;
    }
  }

  /**
   * Set player ready status
   */
  async setPlayerReady(roomId: string, walletAddress: string, ready: boolean): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      const roomDataKey = `${RoomManager.ROOM_KEY_PREFIX}${roomId}`;

      const roomData = await client.get(roomDataKey);
      if (!roomData) {
        return false;
      }

      const room: BattleRoom = JSON.parse(roomData);

      // Update ready status
      if (room.player1.address === walletAddress) {
        room.player1.ready = ready;
      } else if (room.player2?.address === walletAddress) {
        room.player2.ready = ready;
      } else {
        return false;
      }

      // Save updated room
      await client.set(roomDataKey, JSON.stringify(room), { EX: 3600 });

      // Notify room
      this.socketManager.emitToRoom(roomId, 'room:player_ready', {
        walletAddress,
        ready,
      });

      // Check if both players are ready
      if (room.player2 && room.player1.ready && room.player2.ready) {
        await this.startBattleCountdown(roomId);
      }

      return true;

    } catch (error) {
      logger.error('Error setting player ready', { error, roomId, walletAddress });
      return false;
    }
  }

  /**
   * Start battle countdown
   */
  private async startBattleCountdown(roomId: string): Promise<void> {
    try {
      const client = redisClient.getClient();
      const roomDataKey = `${RoomManager.ROOM_KEY_PREFIX}${roomId}`;

      const roomData = await client.get(roomDataKey);
      if (!roomData) {
        return;
      }

      const room: BattleRoom = JSON.parse(roomData);
      room.status = 'countdown';

      await client.set(roomDataKey, JSON.stringify(room), { EX: 3600 });

      logger.info('Starting battle countdown', { roomId });

      // Emit countdown events
      this.socketManager.emitToRoom(roomId, 'game:countdown', { count: 3 });
      
      setTimeout(() => {
        this.socketManager.emitToRoom(roomId, 'game:countdown', { count: 2 });
      }, 1000);

      setTimeout(() => {
        this.socketManager.emitToRoom(roomId, 'game:countdown', { count: 1 });
      }, 2000);

      setTimeout(() => {
        this.startBattle(roomId);
      }, 3000);

    } catch (error) {
      logger.error('Error starting countdown', { error, roomId });
    }
  }

  /**
   * Start the battle
   */
  private async startBattle(roomId: string): Promise<void> {
    try {
      const client = redisClient.getClient();
      const roomDataKey = `${RoomManager.ROOM_KEY_PREFIX}${roomId}`;

      const roomData = await client.get(roomDataKey);
      if (!roomData) {
        return;
      }

      const room: BattleRoom = JSON.parse(roomData);
      room.status = 'active';
      room.startTime = Date.now();

      await client.set(roomDataKey, JSON.stringify(room), { EX: 3600 });

      logger.info('Battle started', { roomId });

      this.socketManager.emitToRoom(roomId, 'game:start', {
        roomId,
        startTime: room.startTime,
      });

    } catch (error) {
      logger.error('Error starting battle', { error, roomId });
    }
  }

  /**
   * Get room by ID
   */
  async getRoom(roomId: string): Promise<BattleRoom | null> {
    try {
      const client = redisClient.getClient();
      const roomDataKey = `${RoomManager.ROOM_KEY_PREFIX}${roomId}`;

      const roomData = await client.get(roomDataKey);
      if (!roomData) {
        return null;
      }

      return JSON.parse(roomData);

    } catch (error) {
      logger.error('Error getting room', { error, roomId });
      return null;
    }
  }

  /**
   * Update room
   */
  async updateRoom(room: BattleRoom): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      const roomDataKey = `${RoomManager.ROOM_KEY_PREFIX}${room.roomId}`;

      await client.set(roomDataKey, JSON.stringify(room), { EX: 3600 });
      return true;

    } catch (error) {
      logger.error('Error updating room', { error, roomId: room.roomId });
      return false;
    }
  }

  /**
   * Delete room
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      const roomDataKey = `${RoomManager.ROOM_KEY_PREFIX}${roomId}`;

      // Get room to find room key
      const roomData = await client.get(roomDataKey);
      if (roomData) {
        const room: BattleRoom = JSON.parse(roomData);
        if (room.roomKey) {
          await client.del(`${RoomManager.ROOM_KEY_PREFIX}key:${room.roomKey}`);
        }
      }

      await client.del(roomDataKey);
      logger.info('Room deleted', { roomId });
      return true;

    } catch (error) {
      logger.error('Error deleting room', { error, roomId });
      return false;
    }
  }

  /**
   * Handle player leaving room
   */
  async leaveRoom(roomId: string, walletAddress: string): Promise<void> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) {
        return;
      }

      // Remove player from socket room
      this.socketManager.leaveRoom(walletAddress, roomId);

      // If battle hasn't started, just remove the room
      if (room.status === 'waiting') {
        await this.deleteRoom(roomId);
        this.socketManager.emitToRoom(roomId, 'room:closed', {
          reason: 'Player left before battle started',
        });
      } else {
        // If battle is active, handle as forfeit
        this.socketManager.emitToRoom(roomId, 'player:left', {
          walletAddress,
        });
      }

      logger.info('Player left room', { roomId, walletAddress });

    } catch (error) {
      logger.error('Error handling player leave', { error, roomId, walletAddress });
    }
  }
}
