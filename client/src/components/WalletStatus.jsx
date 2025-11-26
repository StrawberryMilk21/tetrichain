const WalletStatus = ({ account, balance, isLoadingBalance, onRefreshBalance, username, isLoadingUsername }) => {
    const formatAddress = (address) => {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="token-balance">
            <h3>Your Profile</h3>
            {account ? (
                <>
                    {username && (
                        <p className="username-display">
                            <span className="username-label">Username:</span>
                            <span className="username-value">{username}</span>
                        </p>
                    )}
                    {isLoadingUsername && (
                        <p className="username-loading">Loading username...</p>
                    )}
                    <p className="wallet-address">{formatAddress(account.address)}</p>
                    <p className="balance-amount">
                        {isLoadingBalance ? 'Loading...' : `${balance.toFixed(2)} TETRI`}
                    </p>
                    <button 
                        onClick={onRefreshBalance} 
                        className="btn btn-secondary"
                        disabled={isLoadingBalance}
                    >
                        {isLoadingBalance ? 'Loading...' : 'Refresh'}
                    </button>
                </>
            ) : (
                <p className="empty-state">Connect wallet to view your profile</p>
            )}
        </div>
    );
};

export default WalletStatus;
