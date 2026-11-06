import type { Dispatch, SetStateAction } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

type SearchBarProps = {
    searchKeyword: string;
    setSearchKeyword: Dispatch<SetStateAction<string>>;
    onSearch?: () => void;
    /** compact: 게시판 목록 툴바용, wide: 내 활동처럼 한 줄 전체를 쓰는 검색창 */
    variant?: "compact" | "wide";
    placeholder?: string;
    className?: string;
};

export default function SearchBar({
    searchKeyword,
    setSearchKeyword,
    onSearch,
    variant = "compact",
    placeholder = "제목 검색",
    className,
}: SearchBarProps) {
    const isWide = variant === "wide";

    return (
        <form
            role="search"
            className={clsx(
                "flex items-center gap-1 rounded-xl",
                isWide
                    ? "w-full h-12.5 pl-4 pr-1.5 bg-surface border border-textThr"
                    : "h-11 pl-3.5 pr-1 bg-field",
                className
            )}
            onSubmit={(event) => {
                event.preventDefault();
                onSearch?.();
            }}
        >
            {isWide && <Search aria-hidden="true" className="shrink-0 size-4.5 text-textSub" />}
            <label htmlFor="board-search" className="sr-only">검색어</label>
            <input
                type="text"
                id="board-search"
                className={clsx(
                    "min-w-0 flex-1 min-h-10 border-0 bg-transparent p-0 text-textBase placeholder:text-textSub/70 focus:ring-0",
                    isWide ? "ml-1.5 text-[15px]" : "w-full md:w-45 text-sm"
                )}
                placeholder={placeholder}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {isWide ? (
                <button
                    type="submit"
                    className="shrink-0 min-h-10 px-4 rounded-lg bg-field text-sm font-bold text-textBase hover:bg-textThr focus-visible:outline-2 focus-visible:outline-primary"
                >
                    검색
                </button>
            ) : (
                <button
                    type="submit"
                    aria-label="검색"
                    className="shrink-0 flex items-center justify-center size-10 rounded-lg text-textSub hover:bg-textThr/60 hover:text-textBase focus-visible:outline-2 focus-visible:outline-primary"
                >
                    <Search aria-hidden="true" className="size-4.5" />
                </button>
            )}
        </form>
    )
};
