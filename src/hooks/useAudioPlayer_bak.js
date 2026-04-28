import {useState, useRef, useEffect, useCallback} from "react";
import {flushSync} from 'react-dom';

export default function useAudioPlayer(initialTracks = [], initialIndex = 0) {
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

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack?.mp3Url) return;

        audio.src = currentTrack.mp3Url;
        audio.load();

        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        }
    }, [currentTrack]);

    // Play/pause when isPlaying toggles
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // Wire up timeupdate, loadedmetadata, ended
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => setDuration(audio.duration);
        const onTime = () => setCurrentTime(audio.currentTime);
        const onEnded = () => handleNext();

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("ended", onEnded);
        };
    }, [/* no deps so this only runs once */]);

    /*const play = useCallback(() => {
        if (!currentTrack?.mp3Url) return;
        setIsPlaying(true);
    }, [currentTrack]);*/

    const play = useCallback(async () => {
        if (!currentTrack?.mp3Url) return;
        const audio = audioRef.current;
        if (!audio) return;

        audio.src = currentTrack.mp3Url;
        try {
            await audio.play();
            setIsPlaying(true);
        } catch (err) {
            console.warn("🎧 재생 실패, mp3 URL 갱신 시도 중...", err);

            if (currentTrack.streamJsonPath) {
                try {
                    const proxyUrl = `https://newtronome.netlify.app/api/stream?path=${encodeURIComponent(
                        new URL(currentTrack.streamJsonPath).pathname
                    )}&client_id=${import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID}`;

                    const res = await fetch(proxyUrl);
                    const {url: newUrl} = await res.json();

                    if (newUrl) {
                        audio.src = newUrl;
                        await audio.play();
                        setIsPlaying(true);
                    } else {
                        console.error("❌ 프록시 응답에 URL 없음");
                        setIsPlaying(false);
                    }
                } catch (reErr) {
                    console.error("❌ mp3 URL 프록시 재요청 실패:", reErr);
                    setIsPlaying(false);
                }
            } else {
                setIsPlaying(false);
            }
        }
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
        const prevIdx = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;

        flushSync(() => {
            setCurrentIndex(prevIdx);
            setIsPlaying(true);
        });

        audioRef.current?.play().catch(() => setIsPlaying(false));
    }, [currentIndex, tracks]);

    const handleNext = useCallback(() => {
        const nextIdx = (currentIndex + 1) % tracks.length;

        flushSync(() => {
            setCurrentIndex(nextIdx);
            setIsPlaying(true);
        });

        audioRef.current?.play().catch(() => setIsPlaying(false));
    }, [currentIndex, tracks]);

    const setPlaylist = useCallback((newTracks, startIndex = 0) => {
        setTracks(newTracks);
        setCurrentIndex(startIndex);
        setIsPlaying(false);
        setCurrentTime(0);
    }, []);

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const rewindToStart = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const shuffleTracks = useCallback(() => {
        const shuffled = [...tracks];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        flushSync(() => {
            setTracks(shuffled);
            setCurrentIndex(0); // 첫 곡부터 재생
            setIsPlaying(true);
        });

        audioRef.current?.play().catch(() => setIsPlaying(false));
    }, [tracks]);

    const playOneOff = useCallback((track) => {
             setOneOffTrack(track);
             setIsPlaying(true);
         }, []);

    const handleTrackClick = useCallback((track) => {
        setOneOffTrack(null);
        const index = tracks.findIndex(t => t.id === track.id);

        if (index === -1) return;

        if (currentTrack?.id === track.id) {
            isPlaying ? pause() : play();
        } else {
            setCurrentIndex(index);
            setIsPlaying(true);
        }
    }, [tracks, currentTrack, isPlaying, pause, play]);

    const select = useCallback(idx => {
        setOneOffTrack(null);
        flushSync(() => {
            setCurrentIndex(idx);
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
        onTimeUpdate: e => setCurrentTime(e.target.currentTime),
        onLoadedMetadata: e => setDuration(e.target.duration),
        mute: toggleMute,
        isMuted,
        rewindToStart,
        shuffle: shuffleTracks,
        handleTrackClick,
        playOneOff,
    };
}
