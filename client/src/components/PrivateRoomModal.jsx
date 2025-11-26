import { useState } from 'react';
import './PrivateRoomModal.css';

function PrivateRoomModal({ 
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  roomData,
  waitingForOpponent
}) {
  const [mode, setMode] = useState('select'); // select, create, join
  const [roomKey, setRoomKey] = useState('');
  const [wager, setWager] = useState(10);

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    onCreateRoom(wager);
  };

  const handleJoinRoom = () => {
    if (roomKey.trim().length === 6) {
      onJoinRoom(roomKey.toUpperCase());
    }
  };

  const copyRoomKey = () => {
    if (roomData?.roomKey) {
      navigator.clipboard.writeText(roomData.roomKey);
      // Could add a toast notification here
    }
  };

  // Waiting for opponent screen
  if (waitingForOpponent && roomData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="private-room-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <h2>PRIVATE ROOM</h2>
          
          <div className="room-waiting-container">
            <div className="room-key-display">
              <label>ROOM KEY</label>
              <div className="room-key-value">
                {roomData.roomKey}
              </div>
              <button 
                className="btn btn-secondary copy-button"
                onClick={copyRoomKey}
              >
                📋 COPY KEY
              </button>
            </div>

            <div className="waiting-status">
              <div className="waiting-spinner">
                <div className="spinner"></div>
              </div>
              <p className="waiting-text">WAITING FOR OPPONENT...</p>
              <p className="waiting-subtext">Share the room key with your friend</p>
            </div>

            <div className="room-info">
              <div className="info-item">
                <span className="info-label">Wager:</span>
                <span className="info-value">{roomData.wager} TETRI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode selection screen
  if (mode === 'select') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="private-room-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <h2>PRIVATE ROOM</h2>
          <p className="modal-subtitle">Create a room or join with a key</p>

          <div className="private-room-options">
            <button 
              className="private-room-option create-option"
              onClick={() => setMode('create')}
            >
              <div className="option-icon">➕</div>
              <div className="option-content">
                <h3>CREATE ROOM</h3>
                <p>Generate a room key to share</p>
              </div>
            </button>

            <button 
              className="private-room-option join-option"
              onClick={() => setMode('join')}
            >
              <div className="option-icon">🔑</div>
              <div className="option-content">
                <h3>JOIN ROOM</h3>
                <p>Enter a room key to join</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create room screen
  if (mode === 'create') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="private-room-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <h2>CREATE PRIVATE ROOM</h2>
          <p className="modal-subtitle">Set your wager and create a room</p>

          <div className="wager-input-group">
            <label htmlFor="create-wager">WAGER AMOUNT</label>
            <div className="wager-input-wrapper">
              <input
                id="create-wager"
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

          <div className="modal-actions">
            <button 
              className="btn btn-primary"
              onClick={handleCreateRoom}
            >
              CREATE ROOM
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setMode('select')}
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join room screen
  if (mode === 'join') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="private-room-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <h2>JOIN PRIVATE ROOM</h2>
          <p className="modal-subtitle">Enter the 6-character room key</p>

          <div className="room-key-input-group">
            <label htmlFor="room-key">ROOM KEY</label>
            <input
              id="room-key"
              type="text"
              maxLength="6"
              value={roomKey}
              onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="room-key-input"
            />
          </div>

          <div className="modal-actions">
            <button 
              className="btn btn-primary"
              onClick={handleJoinRoom}
              disabled={roomKey.length !== 6}
            >
              JOIN ROOM
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setMode('select')}
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PrivateRoomModal;
