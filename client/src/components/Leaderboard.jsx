const Leaderboard = ({ scores, currentPlayerAddress, isLoading, onRefresh, usernameMap = {} }) => {
    const formatAddress = (address) => {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getDisplayName = (address) => {
        // If we have a username for this address, use it
        if (usernameMap[address]) {
            return usernameMap[address];
        }
        // Otherwise, show formatted address
        return formatAddress(address);
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="leaderboard">
            <h3>Leaderboard</h3>
            <button onClick={onRefresh} className="btn btn-secondary" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Refresh'}
            </button>
            <div className="leaderboard-list">
                {isLoading ? (
                    <p className="empty-state">Loading leaderboard...</p>
                ) : scores.length > 0 ? (
                    scores.map((entry, index) => (
                        <div 
                            key={index} 
                            className={`leaderboard-entry ${currentPlayerAddress === entry.player ? 'highlight' : ''}`}
                        >
                            <span className="leaderboard-rank">#{index + 1}</span>
                            <span className="leaderboard-player">{getDisplayName(entry.player)}</span>
                            <span className="leaderboard-score">{entry.score.toLocaleString()}</span>
                            <span className="leaderboard-timestamp">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                    ))
                ) : (
                    <p className="empty-state">No scores yet. Be the first!</p>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
