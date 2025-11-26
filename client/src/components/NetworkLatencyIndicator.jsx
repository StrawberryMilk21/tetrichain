import { useState, useEffect, useRef } from 'react';
import './NetworkLatencyIndicator.css';

function NetworkLatencyIndicator({ socket, isConnected }) {
  const [latency, setLatency] = useState(0);
  const [quality, setQuality] = useState('good'); // good, fair, poor
  const pingIntervalRef = useRef(null);
  const pingStartTimeRef = useRef(null);

  useEffect(() => {
    if (!socket || !isConnected) {
      setLatency(0);
      return;
    }

    // Measure latency every 3 seconds
    pingIntervalRef.current = setInterval(() => {
      pingStartTimeRef.current = Date.now();
      socket.emit('ping');
    }, 3000);

    // Listen for pong response
    const handlePong = () => {
      if (pingStartTimeRef.current) {
        const rtt = Date.now() - pingStartTimeRef.current;
        setLatency(rtt);

        // Determine connection quality
        if (rtt < 100) {
          setQuality('good');
        } else if (rtt < 300) {
          setQuality('fair');
        } else {
          setQuality('poor');
        }
      }
    };

    socket.on('pong', handlePong);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      socket.off('pong', handlePong);
    };
  }, [socket, isConnected]);

  if (!isConnected) {
    return (
      <div className="network-indicator disconnected">
        <span className="indicator-icon">⚠️</span>
        <span className="indicator-text">DISCONNECTED</span>
      </div>
    );
  }

  return (
    <div className={`network-indicator ${quality}`}>
      <span className="indicator-icon">
        {quality === 'good' && '🟢'}
        {quality === 'fair' && '🟡'}
        {quality === 'poor' && '🔴'}
      </span>
      <span className="indicator-text">
        {latency}ms
      </span>
      {quality === 'poor' && (
        <span className="lag-warning">HIGH LAG</span>
      )}
    </div>
  );
}

export default NetworkLatencyIndicator;
