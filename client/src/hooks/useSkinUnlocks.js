import { useState, useEffect, useCallback } from 'react';
import { SKINS, getUnlockedSkins } from '../skinConfig.js';

/**
 * Hook to manage skin unlocks based on score milestones
 */
export function useSkinUnlocks(currentScore) {
    const [unlockedSkins, setUnlockedSkins] = useState(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem('unlockedSkins');
        return saved ? JSON.parse(saved) : [0]; // Classic skin (id: 0) is always unlocked
    });

    const [newlyUnlocked, setNewlyUnlocked] = useState(null);

    // Check for newly unlocked skins when score changes
    useEffect(() => {
        if (!currentScore) return;

        const currentlyUnlocked = getUnlockedSkins(currentScore);
        const newUnlocks = currentlyUnlocked.filter(
            skin => !unlockedSkins.includes(skin.id)
        );

        if (newUnlocks.length > 0) {
            // Add newly unlocked skins
            const updatedUnlocks = [...unlockedSkins, ...newUnlocks.map(s => s.id)];
            setUnlockedSkins(updatedUnlocks);
            localStorage.setItem('unlockedSkins', JSON.stringify(updatedUnlocks));

            // Show notification for the first newly unlocked skin
            setNewlyUnlocked(newUnlocks[0]);
        }
    }, [currentScore, unlockedSkins]);

    // Clear notification
    const clearNotification = useCallback(() => {
        setNewlyUnlocked(null);
    }, []);

    // Check if a specific skin is unlocked
    const isSkinUnlocked = useCallback((skinId) => {
        return unlockedSkins.includes(skinId);
    }, [unlockedSkins]);

    // Get all unlocked skin objects
    const getUnlockedSkinObjects = useCallback(() => {
        return SKINS.filter(skin => unlockedSkins.includes(skin.id));
    }, [unlockedSkins]);

    return {
        unlockedSkins,
        newlyUnlocked,
        clearNotification,
        isSkinUnlocked,
        getUnlockedSkinObjects,
    };
}
