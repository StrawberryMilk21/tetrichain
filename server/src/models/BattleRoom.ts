export interface Player {
  address: string;
  username: string;
  socketId: string;
  ready: boolean;
}

export interface BattleRoom {
  roomId: string;
  roomKey?: string; // For private rooms
  player1: Player;
  player2?: Player;
  wager: number;
  status: 'waiting' | 'countdown' | 'active' | 'ended';
  startTime?: number;
  battleObjectId?: string; // On-chain battle object
}

export interface GameStateUpdate {
  playerId: string;
  grid: number[][];
  currentPiece: any;
  score: number;
  linesCleared: number;
  timestamp: number;
}

export interface GarbageEvent {
  fromPlayer: string;
  toPlayer: string;
  lines: number;
  timestamp: number;
}
