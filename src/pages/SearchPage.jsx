import {useState, useRef, useEffect} from 'react';
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import useSoundCloudApi from "../hooks/useSoundCloudApi.js";
import {useAudioPlayerContext} from "../contexts/useAudioPlayerContext.js";
import TrackItem from "../components/track/TrackItem.jsx";
import {Search, CirclePlus} from "lucide-react";
import TrackItemSkeleton from "../components/track/TrackItemSkeleton.jsx";
import {AudioEqualizerIcon} from "../components/icons/index.js";
import SearchPanel from "../components/player/SearchPanel.jsx";

export default function SearchPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const qParam = searchParams.get("q") || "";
    const [results, setResults] = useState(null);

    const {loading, searchTracksWithDetails} = useSoundCloudApi();
    // AudioPlayerContext에서 재생목록 setter 가져오기
    const {setPlaylist, isPlaying: globalPlaying} = useAudioPlayerContext();

    const handleSearch = (term) => {
        if (!term) return;
        navigate(`/search?q=${encodeURIComponent(term)}`);
    }

    // 검색 로직
    useEffect(() => {
        if (!qParam) {
            setResults(null);
            return;
        }
        (async () => {
            const list = await searchTracksWithDetails(qParam, 50);
            setResults(list);
        })();
    }, [qParam, searchTracksWithDetails]);

    const audioPreviewRef = useRef(null);
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const [currentPreviewId, setCurrentPreviewId] = useState(null);

    // 재생·일시정지 함수들
    const startPreview = (track) => {
        if (!audioPreviewRef.current || audioPreviewRef.current.src !== track.mp3Url) {
            audioPreviewRef.current?.pause();
            audioPreviewRef.current = new Audio(track.mp3Url);
            audioPreviewRef.current.onended = () => {
                setPreviewPlaying(false);
                setCurrentPreviewId(null);
            };
        }
        audioPreviewRef.current.play();
        setCurrentPreviewId(track.id);
        setPreviewPlaying(true);
    };
    const stopPreview = () => {
        audioPreviewRef.current?.pause();
        setPreviewPlaying(false);
        setCurrentPreviewId(null);
    };

    // TrackItem에 넘겨줄 공통 클릭 핸들러
    const onPreviewToggle = (track) => {
        const isThis = previewPlaying && currentPreviewId === track.id;
        isThis ? stopPreview() : startPreview(track);
    };

    // 1) 컴포넌트 언마운트 혹은 라우트 변경 시 정리
    useEffect(() => {
        return () => {
            stopPreview();
        };
    }, [location]);

    // 2) 전역 플레이어가 재생 모드로 바뀌면(하단 플레이 버튼 등) 프리뷰 중단
    useEffect(() => {
        if (previewPlaying && globalPlaying) {
            stopPreview();
        }
    }, [globalPlaying, previewPlaying]);


    return (
        <div className="lg:p-4">
            <SearchPanel className="lg:hidden" showSuggestions={true} onSearch={handleSearch} />
            {/* 검색 전 */}
            {results === null && !loading && (
                <div className="flex flex-col items-center justify-center mb-5">
                    <span className="mb-4"><AudioEqualizerIcon isPlaying={true} className="size-10 text-primary" /></span>
                    <p className="text-center text-primary text-sm md:text-base">
                        어떤 곡을 찾고 계신가요? <br className="inline md:hidden" />검색어를 입력하고 Enter를 눌러보세요.
                    </p>
                </div>
            )}

            {/* 로딩 중 (검색 후) */}
            {loading && results === null && (
                <>
                    <div className="flex gap-x-4 items-center mb-5">
                        <h2 className="text-xl flex items-center gap-x-2">
                            <Search/>
                            <span>검색 중</span>
                        </h2>
                        <div
                            className="animate-spin inline-block size-6 border-3 border-current border-t-transparent text-primary rounded-full"
                            role="status" aria-label="loading">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8 lg:gap-y-14 mt-6">
                        {Array.from({length: 12}).map((_, i) => (
                            <TrackItemSkeleton key={i}/>
                        ))}
                    </div>
                </>
            )}

            {/* 검색 후 빈 결과 */}
            {!loading && Array.isArray(results) && results.length === 0 && (
                <p className="text-center text-gray-500">검색 결과가 없어요.</p>
            )}

            {/* 검색 후 결과 리스트 */}
            {!loading && Array.isArray(results) && results.length > 0 && (
                <>
                    <div className="flex gap-x-4 items-center mb-8">
                        <h2 className="text-base md:text-xl flex items-center gap-x-2 text-textSub">
                            <Search/>
                            <span>검색 결과 “<b className="font-inter font-black text-textBase">{qParam}</b>”</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8 lg:gap-y-14 mt-6">
                        {results.map((track, idx) => {
                            const isThisPlaying = previewPlaying && currentPreviewId === track.id;

                            return (
                                <div key={`${track.id}-${idx}`}>
                                    <TrackItem
                                        idx={idx}
                                        track={track}
                                        handleTrackClick={() => onPreviewToggle(track)}
                                        select={() => onPreviewToggle(track)}
                                        isPlayingPreview={isThisPlaying}

                                    />
                                    <button
                                        onClick={() => setPlaylist(prev => [...prev, track])
                                            // MainLayout 으로부터 내려받은 setPlaylist 훅을
                                            // Context나 prop drilling으로 연결해 주세요.
                                            // 예: PlaylistContext를 만들어서 여기서 dispatch(addTrack(track))
                                        }
                                        className="inline-flex items-center gap-x-1 px-3 py-2 text-primary rounded-3xl text-sm"
                                    >
                                        <CirclePlus className="size-5"/>
                                        추가
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
