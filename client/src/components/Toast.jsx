import React, { useEffect } from 'react';

const Toast = ({ type = 'success', message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, type === 'error' ? 10000 : 5000);

        return () => clearTimeout(timer);
    }, [type, onClose]);

    return (
        <div className={`toast ${type}`}>
            <p>{message}</p>
            <button onClick={onClose} className="close-btn">&times;</button>
        </div>
    );
};

export default Toast;
