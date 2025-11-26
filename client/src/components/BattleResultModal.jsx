import './BattleResultModal.css';

function BattleResultModal({
  isOpen,
  isWinner,
  winnerUsername,
  loserUsername,
  finalScores,
  tokensWon,
  tokensLost,
  battleDuration,
  onPlayAgain,
  onBackToMenu
}) {
  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay">
      <div className="battle-result-modal">
        {/* Result Header */}
        <div className={`result-header ${isWinner ? 'victory' : 'defeat'}`}>
          <div className="result-icon">
            {isWinner ? '👑' : '💀'}
          </div>
          <h1 className="result-title">
            {isWinner ? 'VICTORY!' : 'DEFEAT'}
          </h1>
          <p className="result-subtitle">
            {isWinner 
              ? `You defeated ${loserUsername}!`
              : `${winnerUsername} defeated you!`
            }
          </p>
        </div>

        {/* Battle Stats */}
        <div className="battle-stats">
          <h3>BATTLE SUMMARY</h3>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Duration</span>
              <span className="stat-value">{formatTime(battleDuration)}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Your Score</span>
              <span className="stat-value">{finalScores.player.toLocaleString()}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Opponent Score</span>
              <span className="stat-value">{finalScores.opponent.toLocaleString()}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Score Difference</span>
              <span className="stat-value">
                {Math.abs(finalScores.player - finalScores.opponent).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tokens Won/Lost */}
        <div className={`tokens-result ${isWinner ? 'won' : 'lost'}`}>
          <div className="tokens-icon">
            {isWinner ? '💰' : '📉'}
          </div>
          <div className="tokens-info">
            <span className="tokens-label">
              {isWinner ? 'TOKENS WON' : 'TOKENS LOST'}
            </span>
            <span className="tokens-amount">
              {isWinner ? '+' : '-'}{isWinner ? tokensWon : tokensLost} TETRI
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions">
          <button 
            className="btn btn-primary"
            onClick={onPlayAgain}
          >
            PLAY AGAIN
          </button>
          <button 
            className="btn btn-secondary"
            onClick={onBackToMenu}
          >
            BACK TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}

export default BattleResultModal;
