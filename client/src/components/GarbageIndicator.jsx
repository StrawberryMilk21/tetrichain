import { useEffect, useState } from 'react';
import './GarbageIndicator.css';

function GarbageIndicator({ incomingGarbageLines }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (incomingGarbageLines > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [incomingGarbageLines]);

  if (incomingGarbageLines === 0) {
    return null;
  }

  return (
    <div className={`garbage-indicator ${isAnimating ? 'animating' : ''}`}>
      <div className="garbage-warning">
        <span className="warning-icon">⚠️</span>
        <span className="warning-text">INCOMING</span>
      </div>
      
      <div className="garbage-count">
        <span className="count-value">{incomingGarbageLines}</span>
        <span className="count-label">
          {incomingGarbageLines === 1 ? 'LINE' : 'LINES'}
        </span>
      </div>

      <div className="garbage-bars">
        {Array.from({ length: Math.min(incomingGarbageLines, 10) }).map((_, i) => (
          <div 
            key={i} 
            className="garbage-bar"
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
        {incomingGarbageLines > 10 && (
          <div className="garbage-overflow">+{incomingGarbageLines - 10}</div>
        )}
      </div>
    </div>
  );
}

export default GarbageIndicator;
