import { useState } from 'react';
import './MultiplayerMenu.css';

function MultiplayerMenu({ 
  onRandomMatchmaking, 
  onPrivateRoom, 
  matchmakingStatus,
  estimatedWaitTime,
  onCancel 
}) {
  const [wager, setWager] = useState(10);
  const [showWagerInput, setShowWagerInput] = useState(false);

  const handleRandomMatchmaking = () => {
    setShowWagerInput(true);
  };

  const handleStartMatchmaking = () => {
    onRandomMatchmaking(wager);
  };

  const handlePrivateRoom = () => {
    onPrivateRoom(wager);
  };

  // Render matchmaking status
  if (matchmakingStatus && matchmakingStatus !== 'idle') {
    return (
      <div className="multiplayer-menu">
        <div className="matchmaking-status-container">
          <h2>MATCHMAKING</h2>
          
          {matchmakingStatus === 'searching' && (
            <>
              <div className="matchmaking-spinner">
                <div className="spinner"></div>
              </div>
              <p className="status-text">SEARCHING FOR OPPONENT...</p>
              <p className="wager-info">Wager: {wager} TETRI</p>
              {estimatedWaitTime && (
                <p className="wait-time">Estimated wait: {estimatedWaitTime}s</p>
              )}
              <button 
                className="btn btn-secondary cancel-button"
                onClick={onCancel}
              >
                CANCEL
              </button>
            </>
          )}

          {matchmakingStatus === 'found' && (
            <>
              <div className="match-found-icon">✓</div>
              <p className="status-text success">MATCH FOUND!</p>
              <p className="status-subtext">Preparing battle...</p>
            </>
          )}

          {matchmakingStatus === 'countdown' && (
            <>
              <div className="countdown-display">
                <p className="countdown-text">BATTLE STARTING...</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render wager input screen
  if (showWagerInput) {
    return (
      <div className="multiplayer-menu">
        <div className="wager-input-container">
          <h2>SET YOUR WAGER</h2>
          <p className="wager-description">
            Choose how many TETRI tokens to wager. Winner takes all!
          </p>
          
          <div className="wager-input-group">
            <label htmlFor="wager">WAGER AMOUNT</label>
            <div className="wager-input-wrapper">
              <input
                id="wager"
                type="number"
                min="1"
                max="1000"
                value={wager}
                onChange={(e) => setWager(Math.max(1, parseInt(e.target.value) || 1))}
                className="wager-input"
              />
              <span className="wager-unit">TETRI</span>
            </div>
          </div>

          <div className="wager-presets">
            <button onClick={() => setWager(10)} className={wager === 10 ? 'active' : ''}>10</button>
            <button onClick={() => setWager(25)} className={wager === 25 ? 'active' : ''}>25</button>
            <button onClick={() => setWager(50)} className={wager === 50 ? 'active' : ''}>50</button>
            <button onClick={() => setWager(100)} className={wager === 100 ? 'active' : ''}>100</button>
          </div>

          <div className="wager-actions">
            <button 
              className="btn btn-primary"
              onClick={handleStartMatchmaking}
            >
              START MATCHMAKING
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowWagerInput(false)}
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render main menu
  return (
    <div className="multiplayer-menu">
      <h1 className="multiplayer-title">MULTIPLAYER</h1>
      <p className="multiplayer-subtitle">BATTLE OTHER PLAYERS IN REAL-TIME</p>

      <div className="multiplayer-options">
        <button 
          className="multiplayer-option-button random-matchmaking"
          onClick={handleRandomMatchmaking}
        >
          <div className="option-icon">🎲</div>
          <div className="option-content">
            <h3>RANDOM MATCHMAKING</h3>
            <p>Find an opponent with similar wager</p>
          </div>
        </button>

        <button 
          className="multiplayer-option-button private-room"
          onClick={handlePrivateRoom}
        >
          <div className="option-icon">🔒</div>
          <div className="option-content">
            <h3>PRIVATE ROOM</h3>
            <p>Create or join a private battle</p>
          </div>
        </button>
      </div>

      <div className="multiplayer-info">
        <h4>HOW IT WORKS</h4>
        <ul>
          <li>Set your wager amount (TETRI tokens)</li>
          <li>Get matched with an opponent</li>
          <li>Battle in real-time Tetris</li>
          <li>Winner takes both wagers!</li>
        </ul>
      </div>
    </div>
  );
}

export default MultiplayerMenu;
