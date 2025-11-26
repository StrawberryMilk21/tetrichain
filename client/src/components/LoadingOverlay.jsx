import React from 'react';

const LoadingOverlay = ({ message = 'Processing transaction...' }) => {
    return (
        <div className="loading-overlay">
            <div className="spinner"></div>
            <p>{message}</p>
        </div>
    );
};

export default LoadingOverlay;
