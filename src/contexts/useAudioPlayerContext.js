import {useContext} from "react";
import {AudioPlayerContext} from "./audioPlayerContextValue.js";

export function useAudioPlayerContext() {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
    }
    return context;
}
