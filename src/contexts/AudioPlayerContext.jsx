import useAudioPlayer from '../hooks/useAudioPlayer.js';
import {AudioPlayerContext} from "./audioPlayerContextValue.js";

export function AudioPlayerProvider({ children }) {
    const player = useAudioPlayer([], 0);
    return (
        <AudioPlayerContext.Provider value={player}>
            {children}
        </AudioPlayerContext.Provider>
    );
}
