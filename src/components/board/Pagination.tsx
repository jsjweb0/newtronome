import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

type PaginationProps = {
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalPages: number;
    onPageChange?: (page: number) => void;
    label?: string;
};

const MAX_PAGE_BUTTONS = 5;

const arrowClasses =
    "flex items-center justify-center size-11 md:size-10 rounded-[10px] text-textSub hover:bg-field hover:text-textBase focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 disabled:pointer-events-none";

export default function Pagination({
    currentPage,
    setCurrentPage,
    totalPages,
    onPageChange,
    label = "페이지",
}: PaginationProps) {
    let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGE_BUTTONS / 2));
    let endPage = startPage + MAX_PAGE_BUTTONS - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - MAX_PAGE_BUTTONS + 1);
    }

    const pageNumbers: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    const goTo = (page: number) => {
        setCurrentPage(page);
        onPageChange?.(page);
    };

    return (
        <nav className="flex items-center justify-center gap-1 pt-1" aria-label={label}>
            <button type="button" className={clsx(arrowClasses, "max-md:hidden")} onClick={() => goTo(1)}>
                <span className="sr-only">첫 페이지로 이동</span>
                <ChevronsLeft aria-hidden="true" className="size-4.5" />
            </button>
            <button type="button" className={arrowClasses} onClick={() => goTo(Math.max(currentPage - 1, 1))}>
                <span className="sr-only">이전 페이지로 이동</span>
                <ChevronLeft aria-hidden="true" className="size-4.5" />
            </button>
            {pageNumbers.map((page) => {
                const isCurrent = currentPage === page;

                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => goTo(page)}
                        aria-label={`${page}페이지`}
                        aria-current={isCurrent ? "page" : undefined}
                        className={clsx(
                            "size-11 md:size-10 rounded-[10px] font-inter text-sm font-bold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                            isCurrent
                                ? "bg-primary text-onPrimary"
                                : "text-textSub hover:bg-field hover:text-textBase"
                        )}
                    >
                        {page}
                    </button>
                )
            })}
            <button type="button" className={arrowClasses} onClick={() => goTo(Math.min(currentPage + 1, totalPages))}>
                <span className="sr-only">다음 페이지로 이동</span>
                <ChevronRight aria-hidden="true" className="size-4.5" />
            </button>
            <button type="button" className={clsx(arrowClasses, "max-md:hidden")} onClick={() => goTo(totalPages)}>
                <span className="sr-only">마지막 페이지로 이동</span>
                <ChevronsRight aria-hidden="true" className="size-4.5" />
            </button>
        </nav>
    )
}
