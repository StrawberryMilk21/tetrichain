const GameInfo = ({ score, level, lines, isPaused, onPause }) => {
    return (
        <>
            <div className="game-info">
                <div className="info-item">
                    <span className="label">Score:</span>
                    <span className="value">{score.toLocaleString()}</span>
                </div>
                <div className="info-item">
                    <span className="label">Lines:</span>
                    <span className="value">{lines}</span>
                </div>
                <div className="info-item">
                    <span className="label">Level:</span>
                    <span className="value">{level}</span>
                </div>
            </div>
            
            <div className="game-controls">
                <button onClick={onPause} className="btn btn-secondary">
                    {isPaused ? 'RESUME' : 'PAUSE'}
                </button>
            </div>
        </>
    );
};

export default GameInfo;
