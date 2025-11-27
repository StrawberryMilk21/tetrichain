import { useEffect, useRef, useState } from 'react';

/**
 * Hook for managing game sounds (BGM and sound effects)
 */
export function useSound() {
    const bgmRef = useRef(null);
    const hoverSoundRef = useRef(null);
    const clickSoundRef = useRef(null);
    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('soundMuted') === 'true';
    });

    useEffect(() => {
        // Initialize BGM
        bgmRef.current = new Audio('/audio/bgm.mp3');
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.3; // 30% volume for BGM

        // Create simple sound effects using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Hover sound effect (short beep)
        const createHoverSound = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        };

        // Click sound effect (deeper beep)
        const createClickSound = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 400;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        };

        hoverSoundRef.current = createHoverSound;
        clickSoundRef.current = createClickSound;

        // Auto-play BGM when component mounts (with user interaction)
        const playBGM = () => {
            if (!isMuted && bgmRef.current) {
                bgmRef.current.play().catch(err => {
                    console.log('BGM autoplay prevented:', err);
                });
            }
        };

        // Try to play after a small delay or on first user interaction
        const handleFirstInteraction = () => {
            playBGM();
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);

        return () => {
            if (bgmRef.current) {
                bgmRef.current.pause();
                bgmRef.current = null;
            }
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
    }, []);

    // Update BGM mute state
    useEffect(() => {
        if (bgmRef.current) {
            if (isMuted) {
                bgmRef.current.pause();
            } else {
                bgmRef.current.play().catch(err => {
                    console.log('BGM play failed:', err);
                });
            }
        }
        localStorage.setItem('soundMuted', isMuted.toString());
    }, [isMuted]);

    const playHoverSound = () => {
        if (!isMuted && hoverSoundRef.current) {
            try {
                hoverSoundRef.current();
            } catch (err) {
                console.log('Hover sound failed:', err);
            }
        }
    };

    const playClickSound = () => {
        if (!isMuted && clickSoundRef.current) {
            try {
                clickSoundRef.current();
            } catch (err) {
                console.log('Click sound failed:', err);
            }
        }
    };

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    return {
        playHoverSound,
        playClickSound,
        toggleMute,
        isMuted,
    };
}
