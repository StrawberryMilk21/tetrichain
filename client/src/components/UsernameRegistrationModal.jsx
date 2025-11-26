import { useState, useEffect } from 'react';
import './UsernameRegistrationModal.css';

function UsernameRegistrationModal({ 
  isOpen, 
  onRegister, 
  onClose,
  isRegistering,
  error 
}) {
  const [username, setUsername] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Validate username
  useEffect(() => {
    if (!username) {
      setIsValid(false);
      setValidationError('');
      return;
    }

    // Check length (3-16 characters)
    if (username.length < 3) {
      setIsValid(false);
      setValidationError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 16) {
      setIsValid(false);
      setValidationError('Username must be 16 characters or less');
      return;
    }

    // Check alphanumeric only
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(username)) {
      setIsValid(false);
      setValidationError('Username must be alphanumeric only');
      return;
    }

    // Valid!
    setIsValid(true);
    setValidationError('');
  }, [username]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid && !isRegistering) {
      onRegister(username);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase
    setUsername(value);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay username-modal-overlay">
      <div className="username-registration-modal">
        <div className="modal-header">
          <h2>CHOOSE YOUR USERNAME</h2>
          <p className="modal-subtitle">
            This will be your identity in battles and leaderboards
          </p>
        </div>

        <form onSubmit={handleSubmit} className="username-form">
          <div className="username-input-group">
            <label htmlFor="username">USERNAME</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="PLAYER123"
              maxLength="16"
              className={`username-input ${validationError ? 'error' : ''} ${isValid ? 'valid' : ''}`}
              autoFocus
              disabled={isRegistering}
            />
            <div className="input-requirements">
              <span className={username.length >= 3 && username.length <= 16 ? 'met' : ''}>
                ✓ 3-16 characters
              </span>
              <span className={/^[a-zA-Z0-9]*$/.test(username) && username.length > 0 ? 'met' : ''}>
                ✓ Alphanumeric only
              </span>
            </div>
            {validationError && (
              <div className="validation-error">{validationError}</div>
            )}
            {error && (
              <div className="registration-error">{error}</div>
            )}
          </div>

          <div className="username-suggestions">
            <p className="suggestions-label">SUGGESTIONS:</p>
            <div className="suggestion-buttons">
              <button
                type="button"
                onClick={() => setUsername('PLAYER' + Math.floor(Math.random() * 10000))}
                className="suggestion-btn"
                disabled={isRegistering}
              >
                Random
              </button>
              <button
                type="button"
                onClick={() => setUsername('TETRIS' + Math.floor(Math.random() * 1000))}
                className="suggestion-btn"
                disabled={isRegistering}
              >
                Tetris Theme
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || isRegistering}
            >
              {isRegistering ? 'REGISTERING...' : 'REGISTER USERNAME'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isRegistering}
            >
              SKIP FOR NOW
            </button>
          </div>
        </form>

        <div className="username-info">
          <h4>USERNAME RULES</h4>
          <ul>
            <li>Must be unique across all players</li>
            <li>Cannot be changed once registered</li>
            <li>Will be stored on the blockchain</li>
            <li>Visible to all players in battles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UsernameRegistrationModal;
