import { logger } from '../utils/logger';

export interface ServerMetrics {
  activeRooms: number;
  playersOnline: number;
  matchmakingQueue: number;
  activeBattles: number;
  totalBattlesCompleted: number;
  uptime: number;
  timestamp: number;
}

export class MetricsService {
  private metrics: ServerMetrics;
  private startTime: number;
  private battleCompletedCount: number = 0;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      activeRooms: 0,
      playersOnline: 0,
      matchmakingQueue: 0,
      activeBattles: 0,
      totalBattlesCompleted: 0,
      uptime: 0,
      timestamp: Date.now(),
    };

    // Log metrics periodically
    setInterval(() => {
      this.logMetrics();
    }, 60000); // Every minute
  }

  /**
   * Update metrics
   */
  updateMetrics(updates: Partial<ServerMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...updates,
      uptime: Date.now() - this.startTime,
      timestamp: Date.now(),
    };
  }

  /**
   * Increment battle completed count
   */
  incrementBattlesCompleted(): void {
    this.battleCompletedCount++;
    this.metrics.totalBattlesCompleted = this.battleCompletedCount;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ServerMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      timestamp: Date.now(),
    };
  }

  /**
   * Log current metrics
   */
  private logMetrics(): void {
    const metrics = this.getMetrics();
    logger.info('Server metrics', {
      activeRooms: metrics.activeRooms,
      playersOnline: metrics.playersOnline,
      matchmakingQueue: metrics.matchmakingQueue,
      activeBattles: metrics.activeBattles,
      totalBattlesCompleted: metrics.totalBattlesCompleted,
      uptimeMinutes: Math.floor(metrics.uptime / 60000),
    });
  }

  /**
   * Get formatted uptime
   */
  getFormattedUptime(): string {
    const uptime = Date.now() - this.startTime;
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
