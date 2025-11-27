import GameBoard from './GameBoard.jsx';
import PiecePreview from './PiecePreview.jsx';
import './BattleView.css';

function BattleView({
  // Local player data
  localPlayer,
  localGameState,
  
  // Opponent data
  opponentPlayer,
  opponentGameState,
  opponentRenderTrigger = 0,
  
  // Battle data
  wager = 0,
  battleTimer = 0,
  vsScore,
  
  // Callbacks
  onForfeit
}) {
  // Default game state if not provided
  const defaultGameState = {
    score: 0,
    linesCleared: 0,
    piecesPlaced: 0,
    grid: Array(20).fill(null).map(() => Array(10).fill(null)),
    currentPiece: null,
    ghostPiece: null,
    holdPiece: null,
    nextQueue: [],
    isPaused: false,
    clearingLines: [],
    renderTrigger: 0
  };

  const localState = localGameState || defaultGameState;
  const opponentState = opponentGameState || defaultGameState;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePPS = (pieces, timeElapsed) => {
    if (timeElapsed === 0) return 0;
    return (pieces / timeElapsed).toFixed(2);
  };

  return (
    <div className="battle-view">
      {/* Battle Header */}
      <div className="battle-header">
        <div className="battle-wager">
          <span className="wager-label">WAGER</span>
          <span className="wager-amount">{wager} TETRI</span>
        </div>
        
        <div className="battle-timer">
          {formatTime(battleTimer)}
        </div>

        <button 
          className="forfeit-button"
          onClick={onForfeit}
          title="Forfeit Battle"
        >
          🏳️ FORFEIT
        </button>
      </div>

      {/* Battle Arena */}
      <div className="battle-arena">
        {/* Local Player Side */}
        <div className="player-side local-player">
          <div className="player-info">
            <div className="player-name">{localPlayer?.username || 'Player'}</div>
            <div className="player-stats">
              <div className="stat">
                <span className="stat-label">SCORE</span>
                <span className="stat-value">{localState.score.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">LINES</span>
                <span className="stat-value">{localState.linesCleared}</span>
              </div>
              <div className="stat">
                <span className="stat-label">PPS</span>
                <span className="stat-value">
                  {calculatePPS(localState.piecesPlaced, battleTimer)}
                </span>
              </div>
            </div>
          </div>

          <div className="game-area-with-previews">
            {/* HOLD */}
            <div className="hold-container">
              <div className="preview-label">HOLD</div>
              <PiecePreview pieceType={localState.holdPiece?.type} />
            </div>

            {/* GAME BOARD */}
            <GameBoard 
              grid={localState.grid}
              currentPiece={localState.currentPiece}
              ghostPiece={localState.ghostPiece}
              isPaused={localState.isPaused}
              clearingLines={localState.clearingLines}
              renderTrigger={localState.renderTrigger}
            />

            {/* NEXT */}
            <div className="next-container">
              <div className="preview-label">NEXT</div>
              {(localState.nextQueue || []).slice(0, 3).map((type, i) => (
                <PiecePreview key={i} pieceType={type} />
              ))}
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="vs-divider">
          <div className="vs-score">
            <div className="vs-label">VS</div>
            <div className="score-comparison">
              <span className={localState.score > opponentState.score ? 'winning' : ''}>
                {localState.score.toLocaleString()}
              </span>
              <span className="vs-dash">-</span>
              <span className={opponentState.score > localState.score ? 'winning' : ''}>
                {opponentState.score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Opponent Side */}
        <div className="player-side opponent-player">
          <div className="player-info">
            <div className="player-name">{opponentPlayer?.username || 'Opponent'}</div>
            <div className="player-stats">
              <div className="stat">
                <span className="stat-label">SCORE</span>
                <span className="stat-value">{opponentState.score.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">LINES</span>
                <span className="stat-value">{opponentState.linesCleared}</span>
              </div>
              <div className="stat">
                <span className="stat-label">PPS</span>
                <span className="stat-value">
                  {calculatePPS(opponentState.piecesPlaced, battleTimer)}
                </span>
              </div>
            </div>
          </div>

          <div className="game-area-with-previews">
            {/* HOLD */}
            <div className="hold-container">
              <div className="preview-label">HOLD</div>
              <PiecePreview pieceType={opponentState.holdPiece?.type} />
            </div>

            {/* GAME BOARD */}
            <GameBoard 
              grid={opponentState.grid}
              currentPiece={opponentState.currentPiece}
              ghostPiece={opponentState.ghostPiece}
              isPaused={false}
              clearingLines={opponentState.clearingLines || []}
              renderTrigger={opponentRenderTrigger}
              isOpponent={true}
            />

            {/* NEXT */}
            <div className="next-container">
              <div className="preview-label">NEXT</div>
              {(opponentState.nextQueue || []).slice(0, 3).map((type, i) => (
                <PiecePreview key={i} pieceType={type} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BattleView;
