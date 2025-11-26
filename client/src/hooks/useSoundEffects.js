import { useRef, useCallback } from 'react';

/**
 * Custom hook for managing game sound effects
 * Uses Web Audio API to generate retro-style game sounds
 */
export const useSoundEffects = () => {
    const audioContextRef = useRef(null);
    const masterVolumeRef = useRef(0.3); // Master volume (0-1)

    // Initialize audio context on first use
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Play a simple tone
    const playTone = useCallback((frequency, duration, volume = 1) => {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'square'; // Retro square wave sound

        gainNode.gain.setValueAtTime(volume * masterVolumeRef.current, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }, [getAudioContext]);

    // Move sound (subtle click)
    const playMove = useCallback(() => {
        playTone(200, 0.05, 0.1);
    }, [playTone]);

    // Rotate sound (quick beep)
    const playRotate = useCallback(() => {
        playTone(400, 0.08, 0.15);
    }, [playTone]);

    // Soft drop sound (lower pitch)
    const playSoftDrop = useCallback(() => {
        playTone(150, 0.05, 0.1);
    }, [playTone]);

    // Hard drop sound (descending tone)
    const playHardDrop = useCallback(() => {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.3 * masterVolumeRef.current, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    }, [getAudioContext]);

    // Lock piece sound (thud)
    const playLock = useCallback(() => {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 100;

        gainNode.gain.setValueAtTime(0.4 * masterVolumeRef.current, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }, [getAudioContext]);

    // Line clear sound (ascending arpeggio)
    const playLineClear = useCallback((linesCleared) => {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        for (let i = 0; i < Math.min(linesCleared, 4); i++) {
            setTimeout(() => {
                playTone(notes[i], 0.15, 0.3);
            }, i * 80);
        }
    }, [getAudioContext, playTone]);

    // Tetris (4 lines) sound - special celebration sound
    const playTetris = useCallback(() => {
        const ctx = getAudioContext();
        const melody = [
            { freq: 659.25, time: 0 },      // E5
            { freq: 783.99, time: 0.1 },    // G5
            { freq: 1046.50, time: 0.2 },   // C6
            { freq: 1318.51, time: 0.3 },   // E6
            { freq: 1046.50, time: 0.4 },   // C6
            { freq: 1318.51, time: 0.5 },   // E6
        ];

        melody.forEach(note => {
            setTimeout(() => {
                playTone(note.freq, 0.15, 0.35);
            }, note.time * 1000);
        });
    }, [getAudioContext, playTone]);

    // Level up sound
    const playLevelUp = useCallback(() => {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 to E6
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                playTone(freq, 0.1, 0.25);
            }, i * 60);
        });
    }, [getAudioContext, playTone]);

    // Game over sound (descending sad tone)
    const playGameOver = useCallback(() => {
        const ctx = getAudioContext();
        const notes = [523.25, 493.88, 440.00, 392.00, 349.23]; // C5 down to F4
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                playTone(freq, 0.3, 0.3);
            }, i * 200);
        });
    }, [getAudioContext, playTone]);

    // Hold piece sound
    const playHold = useCallback(() => {
        playTone(600, 0.1, 0.2);
        setTimeout(() => playTone(800, 0.1, 0.2), 100);
    }, [playTone]);

    return {
        playMove,
        playRotate,
        playSoftDrop,
        playHardDrop,
        playLock,
        playLineClear,
        playTetris,
        playLevelUp,
        playGameOver,
        playHold
    };
};
