import React, { createContext, useContext } from 'react';
import useAudioPlayer from '../hooks/useAudioPlayer.js';

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
    const player = useAudioPlayer([], 0);
    return (
        <AudioPlayerContext.Provider value={player}>
            {children}
        </AudioPlayerContext.Provider>
    );
}

export function useAudioPlayerContext() {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
    }
    return context;
}
