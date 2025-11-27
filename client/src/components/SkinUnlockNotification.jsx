import { useEffect, useState } from 'react';
import { useSkinNFT } from '../hooks/useSkinNFT.js';
import './SkinUnlockNotification.css';

/**
 * Notification component that appears when a new skin is unlocked
 */
export default function SkinUnlockNotification({ skin, onClose }) {
    const { claimSkinNFT, isSkinClaimed, isLoading, error } = useSkinNFT();
    const [claimed, setClaimed] = useState(false);

    useEffect(() => {
        if (skin) {
            setClaimed(isSkinClaimed(skin.id));
        }
    }, [skin, isSkinClaimed]);
    useEffect(() => {
        if (skin && claimed) {
            // Auto-close after 5 seconds if already claimed
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [skin, claimed, onClose]);

    const handleClaimNFT = async () => {
        try {
            await claimSkinNFT(skin.id);
            setClaimed(true);
            // Auto-close after successful claim
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Failed to claim NFT:', err);
        }
    };

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
                    {!claimed ? (
                        <p className="skin-unlock-hint">
                            Claim this skin as an NFT now or visit Customization later!
                        </p>
                    ) : (
                        <p className="skin-unlock-claimed">
                            ✅ NFT Claimed Successfully!
                        </p>
                    )}
                    {error && (
                        <p className="skin-unlock-error">
                            ❌ {error}
                        </p>
                    )}
                </div>
                <div className="skin-unlock-buttons">
                    {!claimed ? (
                        <>
                            <button 
                                className="skin-unlock-claim" 
                                onClick={handleClaimNFT}
                                disabled={isLoading}
                            >
                                {isLoading ? 'CLAIMING...' : 'CLAIM AS NFT'}
                            </button>
                            <button className="skin-unlock-close" onClick={onClose}>
                                LATER
                            </button>
                        </>
                    ) : (
                        <button className="skin-unlock-close" onClick={onClose}>
                            CONTINUE
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
