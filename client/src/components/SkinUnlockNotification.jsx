import { useEffect } from 'react';
import './SkinUnlockNotification.css';

/**
 * Notification component that appears when a new skin is unlocked
 */
export default function SkinUnlockNotification({ skin, onClose }) {
    useEffect(() => {
        if (skin) {
            // Auto-close after 5 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [skin, onClose]);

    if (!skin) return null;

    return (
        <div className="skin-unlock-overlay" onClick={onClose}>
            <div className="skin-unlock-modal" onClick={(e) => e.stopPropagation()}>
                <div className="skin-unlock-header">
                    <h2>🎉 NEW SKIN UNLOCKED!</h2>
                </div>
                <div className="skin-unlock-content">
                    <div className="skin-unlock-name">{skin.name}</div>
                    <div className="skin-unlock-description">{skin.description}</div>
                    <div className="skin-unlock-colors">
                        {Object.values(skin.colors).map((color, i) => (
                            <div
                                key={i}
                                className="skin-color-preview"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <p className="skin-unlock-hint">
                        Visit the Customization menu to claim this skin as an NFT!
                    </p>
                </div>
                <button className="skin-unlock-close" onClick={onClose}>
                    CONTINUE
                </button>
            </div>
        </div>
    );
}
