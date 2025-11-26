import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface AuthenticatedSocket extends Socket {
  walletAddress?: string;
  username?: string;
  lastActivity?: number;
}

export class SocketManager {
  private io: SocketIOServer;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Handle authentication
      socket.on('auth', (data: { walletAddress: string; username: string; signature?: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      // Handle reconnection
      socket.on('reconnect', () => {
        this.handleReconnection(socket);
      });

      // Update last activity on any event
      socket.onAny(() => {
        if (socket.walletAddress) {
          socket.lastActivity = Date.now();
        }
      });
    });
  }

  private handleAuthentication(
    socket: AuthenticatedSocket,
    data: { walletAddress: string; username: string; signature?: string }
  ): void {
    // TODO: Verify wallet signature in production
    // For now, we'll accept the wallet address and username
    
    if (!data.walletAddress || !data.username) {
      socket.emit('auth:error', { message: 'Invalid authentication data' });
      socket.disconnect();
      return;
    }

    socket.walletAddress = data.walletAddress;
    socket.username = data.username;
    socket.lastActivity = Date.now();

    // Cancel any pending disconnect timer for this wallet
    const existingTimer = this.disconnectTimers.get(data.walletAddress);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.disconnectTimers.delete(data.walletAddress);
      logger.info('Reconnection successful, cancelled disconnect timer', {
        walletAddress: data.walletAddress,
      });
    }

    // Store the authenticated socket
    this.connectedClients.set(data.walletAddress, socket);

    socket.emit('auth:success', {
      walletAddress: data.walletAddress,
      username: data.username,
    });

    logger.info('Client authenticated', {
      socketId: socket.id,
      walletAddress: data.walletAddress,
      username: data.username,
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    logger.info('Client disconnected', {
      socketId: socket.id,
      walletAddress: socket.walletAddress,
      reason,
    });

    if (!socket.walletAddress) {
      return;
    }

    // Start a grace period timer
    const timer = setTimeout(() => {
      this.finalizeDisconnection(socket.walletAddress!);
    }, config.game.disconnectGracePeriod);

    this.disconnectTimers.set(socket.walletAddress, timer);

    // Emit disconnect event to other services
    this.io.emit('player:disconnected', {
      walletAddress: socket.walletAddress,
      gracePeriod: config.game.disconnectGracePeriod,
    });
  }

  private handleReconnection(socket: AuthenticatedSocket): void {
    if (!socket.walletAddress) {
      return;
    }

    logger.info('Client reconnected', {
      socketId: socket.id,
      walletAddress: socket.walletAddress,
    });

    // Cancel disconnect timer
    const timer = this.disconnectTimers.get(socket.walletAddress);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(socket.walletAddress);
    }

    // Emit reconnection event
    this.io.emit('player:reconnected', {
      walletAddress: socket.walletAddress,
    });
  }

  private finalizeDisconnection(walletAddress: string): void {
    logger.info('Finalizing disconnection after grace period', { walletAddress });

    this.connectedClients.delete(walletAddress);
    this.disconnectTimers.delete(walletAddress);

    // Emit final disconnect event
    this.io.emit('player:disconnected:final', { walletAddress });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public getSocket(walletAddress: string): AuthenticatedSocket | undefined {
    return this.connectedClients.get(walletAddress);
  }

  public isConnected(walletAddress: string): boolean {
    return this.connectedClients.has(walletAddress);
  }

  public getConnectedCount(): number {
    return this.connectedClients.size;
  }

  public emitToPlayer(walletAddress: string, event: string, data: any): boolean {
    const socket = this.connectedClients.get(walletAddress);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  public emitToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  public joinRoom(walletAddress: string, roomId: string): boolean {
    const socket = this.connectedClients.get(walletAddress);
    if (socket) {
      socket.join(roomId);
      logger.debug('Player joined room', { walletAddress, roomId });
      return true;
    }
    return false;
  }

  public leaveRoom(walletAddress: string, roomId: string): boolean {
    const socket = this.connectedClients.get(walletAddress);
    if (socket) {
      socket.leave(roomId);
      logger.debug('Player left room', { walletAddress, roomId });
      return true;
    }
    return false;
  }
}
