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
  
  // Battle data
  wager,
  battleTimer,
  vsScore,
  
  // Callbacks
  onForfeit
}) {
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
            <div className="player-name">{localPlayer.username}</div>
            <div className="player-stats">
              <div className="stat">
                <span className="stat-label">SCORE</span>
                <span className="stat-value">{localGameState.score.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">LINES</span>
                <span className="stat-value">{localGameState.linesCleared}</span>
              </div>
              <div className="stat">
                <span className="stat-label">PPS</span>
                <span className="stat-value">
                  {calculatePPS(localGameState.piecesPlaced || 0, battleTimer)}
                </span>
              </div>
            </div>
          </div>

          <div className="game-area-with-previews">
            {/* HOLD */}
            <div className="hold-container">
              <div className="preview-label">HOLD</div>
              <PiecePreview pieceType={localGameState.holdPiece?.type} />
            </div>

            {/* GAME BOARD */}
            <GameBoard 
              grid={localGameState.grid}
              currentPiece={localGameState.currentPiece}
              ghostPiece={localGameState.ghostPiece}
              isPaused={localGameState.isPaused}
              clearingLines={localGameState.clearingLines}
              renderTrigger={localGameState.renderTrigger}
            />

            {/* NEXT */}
            <div className="next-container">
              <div className="preview-label">NEXT</div>
              {localGameState.nextQueue && localGameState.nextQueue.slice(0, 3).map((type, i) => (
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
              <span className={localGameState.score > opponentGameState.score ? 'winning' : ''}>
                {localGameState.score.toLocaleString()}
              </span>
              <span className="vs-dash">-</span>
              <span className={opponentGameState.score > localGameState.score ? 'winning' : ''}>
                {opponentGameState.score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Opponent Side */}
        <div className="player-side opponent-player">
          <div className="player-info">
            <div className="player-name">{opponentPlayer.username}</div>
            <div className="player-stats">
              <div className="stat">
                <span className="stat-label">SCORE</span>
                <span className="stat-value">{opponentGameState.score.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">LINES</span>
                <span className="stat-value">{opponentGameState.linesCleared}</span>
              </div>
              <div className="stat">
                <span className="stat-label">PPS</span>
                <span className="stat-value">
                  {calculatePPS(opponentGameState.piecesPlaced || 0, battleTimer)}
                </span>
              </div>
            </div>
          </div>

          <div className="game-area-with-previews">
            {/* HOLD */}
            <div className="hold-container">
              <div className="preview-label">HOLD</div>
              <PiecePreview pieceType={opponentGameState.holdPiece?.type} />
            </div>

            {/* GAME BOARD */}
            <GameBoard 
              grid={opponentGameState.grid}
              currentPiece={opponentGameState.currentPiece}
              ghostPiece={opponentGameState.ghostPiece}
              isPaused={false}
              clearingLines={opponentGameState.clearingLines}
              renderTrigger={opponentGameState.renderTrigger}
              isOpponent={true}
            />

            {/* NEXT */}
            <div className="next-container">
              <div className="preview-label">NEXT</div>
              {opponentGameState.nextQueue && opponentGameState.nextQueue.slice(0, 3).map((type, i) => (
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
