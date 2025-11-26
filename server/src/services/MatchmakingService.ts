import { redisClient } from './RedisClient';
import { logger } from '../utils/logger';
import { config } from '../config';
import { SocketManager } from './SocketManager';

interface MatchmakingPlayer {
  walletAddress: string;
  username: string;
  wager: number;
  joinedAt: number;
}

export class MatchmakingService {
  private static readonly QUEUE_KEY = 'matchmaking:queue';
  private static readonly TIMEOUT_KEY_PREFIX = 'matchmaking:timeout:';
  private socketManager: SocketManager;
  private matchmakingInterval: NodeJS.Timeout | null = null;

  constructor(socketManager: SocketManager) {
    this.socketManager = socketManager;
    this.startMatchmakingLoop();
  }

  /**
   * Add a player to the matchmaking queue
   */
  async joinQueue(walletAddress: string, username: string, wager: number): Promise<void> {
    try {
      const client = redisClient.getClient();
      
      // Check if player is already in queue
      const existingPlayer = await this.getPlayerFromQueue(walletAddress);
      if (existingPlayer) {
        logger.warn('Player already in matchmaking queue', { walletAddress });
        return;
      }

      const player: MatchmakingPlayer = {
        walletAddress,
        username,
        wager,
        joinedAt: Date.now(),
      };

      // Add to queue (sorted set by wager amount for efficient matching)
      await client.zAdd(MatchmakingService.QUEUE_KEY, {
        score: wager,
        value: JSON.stringify(player),
      });

      // Set timeout for this player
      const timeoutKey = `${MatchmakingService.TIMEOUT_KEY_PREFIX}${walletAddress}`;
      await client.setEx(timeoutKey, config.game.matchmakingTimeout / 1000, 'pending');

      logger.info('Player joined matchmaking queue', { walletAddress, username, wager });

      // Start timeout timer
      setTimeout(() => {
        this.handleMatchmakingTimeout(walletAddress);
      }, config.game.matchmakingTimeout);

    } catch (error) {
      logger.error('Error joining matchmaking queue', { error, walletAddress });
      throw error;
    }
  }

  /**
   * Remove a player from the matchmaking queue
   */
  async leaveQueue(walletAddress: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      
      // Get player data before removing
      const player = await this.getPlayerFromQueue(walletAddress);
      if (!player) {
        return false;
      }

      // Remove from queue
      await client.zRem(MatchmakingService.QUEUE_KEY, JSON.stringify(player));

      // Remove timeout key
      const timeoutKey = `${MatchmakingService.TIMEOUT_KEY_PREFIX}${walletAddress}`;
      await client.del(timeoutKey);

      logger.info('Player left matchmaking queue', { walletAddress });
      return true;

    } catch (error) {
      logger.error('Error leaving matchmaking queue', { error, walletAddress });
      return false;
    }
  }

  /**
   * Get a player from the queue by wallet address
   */
  private async getPlayerFromQueue(walletAddress: string): Promise<MatchmakingPlayer | null> {
    try {
      const client = redisClient.getClient();
      const allPlayers = await client.zRange(MatchmakingService.QUEUE_KEY, 0, -1);

      for (const playerStr of allPlayers) {
        const player: MatchmakingPlayer = JSON.parse(playerStr);
        if (player.walletAddress === walletAddress) {
          return player;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting player from queue', { error, walletAddress });
      return null;
    }
  }

  /**
   * Handle matchmaking timeout for a player
   */
  private async handleMatchmakingTimeout(walletAddress: string): Promise<void> {
    try {
      const client = redisClient.getClient();
      const timeoutKey = `${MatchmakingService.TIMEOUT_KEY_PREFIX}${walletAddress}`;
      
      // Check if timeout key still exists
      const exists = await client.exists(timeoutKey);
      if (!exists) {
        return; // Player already matched or left queue
      }

      // Remove player from queue
      await this.leaveQueue(walletAddress);

      // Notify player
      this.socketManager.emitToPlayer(walletAddress, 'matchmaking:timeout', {
        message: 'No match found within timeout period',
      });

      logger.info('Matchmaking timeout', { walletAddress });

    } catch (error) {
      logger.error('Error handling matchmaking timeout', { error, walletAddress });
    }
  }

  /**
   * Start the matchmaking loop that periodically tries to match players
   */
  private startMatchmakingLoop(): void {
    this.matchmakingInterval = setInterval(() => {
      this.tryMatchPlayers();
    }, 2000); // Check every 2 seconds

    logger.info('Matchmaking loop started');
  }

  /**
   * Try to match players in the queue
   */
  private async tryMatchPlayers(): Promise<void> {
    try {
      const client = redisClient.getClient();
      const allPlayers = await client.zRangeWithScores(MatchmakingService.QUEUE_KEY, 0, -1);

      if (allPlayers.length < 2) {
        return; // Not enough players
      }

      // Try to match players with similar wagers
      for (let i = 0; i < allPlayers.length - 1; i++) {
        const player1Data: MatchmakingPlayer = JSON.parse(allPlayers[i].value);
        const player1Wager = allPlayers[i].score;

        for (let j = i + 1; j < allPlayers.length; j++) {
          const player2Data: MatchmakingPlayer = JSON.parse(allPlayers[j].value);
          const player2Wager = allPlayers[j].score;

          // Check if wagers are within tolerance (±20%)
          const wagerDiff = Math.abs(player1Wager - player2Wager);
          const tolerance = player1Wager * config.game.wagerMatchTolerance;

          if (wagerDiff <= tolerance) {
            // Match found!
            await this.createMatch(player1Data, player2Data);
            return; // Exit after creating one match
          }
        }
      }

    } catch (error) {
      logger.error('Error in matchmaking loop', { error });
    }
  }

  /**
   * Create a match between two players
   */
  private async createMatch(player1: MatchmakingPlayer, player2: MatchmakingPlayer): Promise<void> {
    try {
      // Remove both players from queue
      await this.leaveQueue(player1.walletAddress);
      await this.leaveQueue(player2.walletAddress);

      logger.info('Match found', {
        player1: player1.walletAddress,
        player2: player2.walletAddress,
        wager: Math.max(player1.wager, player2.wager),
      });

      // Notify both players
      const matchData = {
        opponent: {
          address: player2.walletAddress,
          username: player2.username,
        },
        wager: Math.max(player1.wager, player2.wager),
      };

      this.socketManager.emitToPlayer(player1.walletAddress, 'matchmaking:found', {
        ...matchData,
        opponent: {
          address: player2.walletAddress,
          username: player2.username,
        },
      });

      this.socketManager.emitToPlayer(player2.walletAddress, 'matchmaking:found', {
        ...matchData,
        opponent: {
          address: player1.walletAddress,
          username: player1.username,
        },
      });

    } catch (error) {
      logger.error('Error creating match', { error });
    }
  }

  /**
   * Get current queue size
   */
  async getQueueSize(): Promise<number> {
    try {
      const client = redisClient.getClient();
      return await client.zCard(MatchmakingService.QUEUE_KEY);
    } catch (error) {
      logger.error('Error getting queue size', { error });
      return 0;
    }
  }

  /**
   * Stop the matchmaking service
   */
  stop(): void {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
      logger.info('Matchmaking loop stopped');
    }
  }
}
