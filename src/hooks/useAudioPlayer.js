import { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import {useToast} from "../contexts/useToast.js";
import {useNotifications} from "../contexts/useNotifications.js";

export default function useAudioPlayer(initialTracks = [], initialIndex = 0) {
    const {showToast} = useToast();
    const {addNotification} = useNotifications();
    const audioRef = useRef(null);
    const [tracks, setTracks] = useState(initialTracks);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const [oneOffTrack, setOneOffTrack] = useState(null);
    const currentTrack = oneOffTrack || tracks[currentIndex] || null;

    const totalDurationMinutes = Math.floor(
        tracks.reduce((acc, track) => acc + (track.duration || 0), 0) / 1000 / 60
    );

    // 1. Initialize Audio element
    useEffect(() => {
        if (!audioRef.current) {
            const audio = new Audio();
            audio.crossOrigin = "anonymous";
            audioRef.current = audio;
        }
    }, []);

    // 2. Update source when track changes
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack?.mp3Url) return;

        audio.src = currentTrack.mp3Url;
        audio.load();
        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        }
    }, [currentTrack]);

    // 3. Play or pause when isPlaying toggles
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // 4. Time update & metadata
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onLoaded = () => setDuration(audio.duration);
        const onTime = () => setCurrentTime(audio.currentTime);
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", onTime);
        return () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("timeupdate", onTime);
        };
    }, []);

    // 5. Ended event uses latest handleNext
    const handleNext = useCallback(() => {
        if (!tracks.length) return;
        const nextIdx = (currentIndex + 1) % tracks.length;
        flushSync(() => {
            setCurrentIndex(nextIdx);
            setIsPlaying(true);
        });
    }, [currentIndex, tracks]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.addEventListener("ended", handleNext);
        return () => audio.removeEventListener("ended", handleNext);
    }, [handleNext]);

    // 6. Controls
    const play = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack?.mp3Url) return;
        audio.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("오디오 재생 실패", err);

                    const id = Date.now();
                    const notification = { id, message: '오디오 재생 실패', type: 'error' };

                    showToast({ message: notification.message });
                    addNotification(notification);
                }
                setIsPlaying(false);
            });
    }, [currentTrack]);

    const pause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        setIsPlaying(false);
    }, []);

    const toggle = useCallback(() => {
        isPlaying ? pause() : play();
    }, [isPlaying, pause, play]);

    const seek = useCallback(t => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = t;
        setCurrentTime(t);
    }, []);

    const handlePrev = useCallback(() => {
        if (!tracks.length) return;
        const prevIdx = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
        flushSync(() => {
            setCurrentIndex(prevIdx);
            setIsPlaying(true);
        });
    }, [currentIndex, tracks]);

    const setPlaylist = useCallback((newTracks, startIndex = 0) => {
        setTracks(newTracks);
        setCurrentIndex(startIndex);
        setIsPlaying(false);
        setCurrentTime(0);
    }, []);

    const toggleMute = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.muted = !audio.muted;
        setIsMuted(audio.muted);
    }, []);

    const rewindToStart = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        setCurrentTime(0);
    }, []);

    const shuffleTracks = useCallback(() => {
        const shuffled = [...tracks];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        flushSync(() => {
            setTracks(shuffled);
            setCurrentIndex(0);
            setIsPlaying(true);
        });
    }, [tracks]);

    const select = useCallback(idx => {
        flushSync(() => {
            setOneOffTrack(null);
            setCurrentIndex(idx);
            setIsPlaying(true);
        });
    }, []);

    const handleTrackClick = useCallback((track) => {
        flushSync(() => {
            setOneOffTrack(null);
            const index = tracks.findIndex(t => t.id === track.id);
            if (index === -1) return;
            setCurrentIndex(index);
            setIsPlaying(true);
        });
    }, [tracks]);

    const playOneOff = useCallback((track) => {
        flushSync(() => {
            setOneOffTrack(track);
            setIsPlaying(true);
        });
    }, []);

    return {
        audioRef,
        tracks,
        currentIndex,
        currentTrack,
        isPlaying,
        currentTime,
        setCurrentTime,
        duration,
        totalDurationMinutes,
        play,
        pause,
        toggle,
        seek,
        prev: handlePrev,
        next: handleNext,
        select,
        setPlaylist,
        mute: toggleMute,
        isMuted,
        rewindToStart,
        shuffle: shuffleTracks,
        handleTrackClick,
        playOneOff,
    };
}
