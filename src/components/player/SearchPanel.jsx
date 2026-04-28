import {useLocation, useSearchParams} from "react-router-dom";
import {useEffect, useRef, useState} from 'react';
import {useToast} from "../../contexts/ToastContext.jsx";
import {Search, Clock3, Music2, X, CircleX, ChevronRight} from "lucide-react";
import clsx from "clsx";

const RECENT_KEY = 'recentSearches';
const MAX_RECENT = 5;

export default function SearchPanel({onSearch, showSuggestions = true, className}) {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();

    const qParam = searchParams.get('q') || '';

    const [q, setQ] = useState('');
    const inputRef = useRef();
    const [recent, setRecent] = useState([]);

    // 예시로 하드코딩한 추천 검색어
    const RECOMMENDED = ['Disco', 'French House', 'Nu Disco', 'Deep House'];

    // 마운트 시 localStorage에서 불러오기
    useEffect(() => {
        const stored = localStorage.getItem(RECENT_KEY);
        if (stored) setRecent(JSON.parse(stored));
    }, []);

    const updateRecent = (keyword) => {
        const updated = [keyword, ...recent.filter(t => t !== keyword)].slice(0, MAX_RECENT);
        setRecent(updated);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    };

    const doSearch = (term) => {
        const keyword = term ?? q.trim();
        if (!keyword) return;
        updateRecent(keyword);
        onSearch(keyword);
    };

    const onClickKeyword = (keyword) => {
        setQ(keyword);
        doSearch(keyword);
    };

    const doClear = () => {
        setQ('');
    };

    const removeRecent = (termToRemove) => {
        const updated = recent.filter(term => term !== termToRemove);
        setRecent(updated);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        showToast({ message: "검색어를 삭제했습니다." });
    };

    useEffect(() => {
        if (qParam) {
            setQ(qParam);
            updateRecent(qParam);
            onSearch(qParam);
        }
    }, [qParam]);

    // 경로(pathname) 변경 시 입력값 초기화
    useEffect(() => {
        setQ('');
    }, [location.pathname]);

    const showSug = showSuggestions && q === '';

    return (
        <div className={`mb-6 ${className}`}>
            <div className="z-[2] relative w-full">
                <span className="flex items-center absolute top-0 left-0 h-full ps-5">
                    <Search className="shrink-0 size-4 md:size-6 text-textSub"/>
                </span>
                <input
                    ref={inputRef}
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSearch()}
                    placeholder="Search SoundCloud…"
                    className="w-full py-3 md:py-4 pl-12 md:pl-14 bg-background rounded-xl md:rounded-2xl text-textBase text-sm md:text-base border border-textThr dark:border-none focus:ring-primary"
                    aria-label="검색어"
                />
                {q && (
                    <button onMouseDown={e => e.preventDefault()}
                            onClick={doClear}
                            className="inline-flex items-center absolute right-1 md:right-0 h-full px-2 md:px-4 text-textSub" aria-label="검색어 삭제">
                        <CircleX className="size-4 md:size-5" />
                    </button>
                )}
            </div>

            {showSug && (
                <div className={clsx(
                    "flex lg:flex-wrap flex-col lg:flex-row gap-4 lg:mt-5 rounded-xl",
                            "max-lg:mt-1 max-lg:p-4 max-lg:bg-background max-lg:shadow-md"
                )}>
                    {/* 최근 검색어 */}
                    {recent.length > 0 && (
                        <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center max-lg:pb-3 max-lg:border-b max-lg:border-b-textThr">
                            <p className="text-sm text-textSub">최근 검색어</p>
                            <ul className="flex flex-wrap gap-2 max-lg:w-full max-lg:flex-col">
                                {recent.map((term) => (
                                    <li key={term}
                                        className="flex items-center gap-x-px lg:bg-textThr rounded-full hover:bg-primary/10">
                                        <button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => onClickKeyword(term)}
                                            className={clsx("group inline-flex items-center gap-x-1 lg:px-2 py-1.5 text-xs lg:text-sm hover:text-primary",
                                                "max-lg:grow max-lg:pl-1"
                                            )}>
                                            <Clock3 className="size-4 text-textSub group-hover:text-primary"/>{term}
                                        </button>
                                        <button onMouseDown={e => e.preventDefault()}
                                                onClick={() => removeRecent(term)}
                                                className="group shrink-0 inline-flex px-2 py-1 max-lg:py-px hover:text-primary"
                                                aria-label={`${term} 삭제`}>
                                            <X className="size-4 text-textSub group-hover:text-primary"/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 추천 검색어 */}
                    <div className={clsx("flex flex-col lg:flex-row gap-2 items-start lg:items-center"
                    )}>
                        <p className="text-sm text-textSub">추천 검색어</p>
                        <ul className="flex flex-wrap gap-2 max-lg:w-full max-lg:flex-col">
                            {RECOMMENDED.map((term) => (
                                <li key={term}
                                    className="inline-flex items-center gap-x-2 lg:bg-textThr rounded-full text-textBase hover:bg-primary/10">
                                    <button
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => onClickKeyword(term)}
                                        className={clsx("group inline-flex items-center gap-x-1 relative lg:px-3 py-1.5 text-xs lg:text-sm hover:text-primary " +
                                            "max-lg:w-full max-lg:pl-1"
                                        )}>
                                        <Music2 className="size-3 text-textSub group-hover:text-primary"/>{term}
                                        <ChevronRight className="block lg:hidden size-3.5 absolute top-1/2 right-1.5 -translate-y-1/2 text-textSub" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>

    );
}
