import {BaseButton} from "../ui/BaseButton.jsx";
import {ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight} from "lucide-react";
import {useEffect, useState} from "react";

export default function Pagination({currentPage, setCurrentPage, totalPages, onPageChange}) {
    const [maxPageButtons, setMaxPageButtons] = useState(5);

    useEffect(() => {
        const handleResize = () => {
            setMaxPageButtons(window.innerWidth < 768 ? 0 : 5);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [])

    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = startPage + maxPageButtons - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    const PageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        PageNumbers.push(i);
    }

    return (
        <nav className="flex items-center justify-center gap-x-1 mt-8 md:mt-12" aria-label="Pagination">
            <BaseButton variant="ghost" className="!py-2 !px-2.5 !shadow-none"
                        onClick={() => {
                            setCurrentPage(1);
                            onPageChange?.(1);
                        }}
            >
                <span className="sr-only">첫 페이지로 이동</span>
                <ChevronsLeft className="size-4"/>
            </BaseButton>
            <BaseButton variant="ghost" className="!py-2 !px-2.5 !shadow-none"
                        onClick={() => {
                            const next = Math.max(currentPage - 1, 1);
                            setCurrentPage(next);
                            onPageChange?.(next);
                        }}
            >
                <span className="sr-only">이전 페이지로 이동</span>
                <ChevronLeft className="size-4"/>
            </BaseButton>
            <div className="flex items-center gap-x-1">
                <span className="px-1 text-gray-800 md:hidden text-xs md:text-base dark:text-white">{currentPage}</span>

                {PageNumbers.map((page) => {
                    return (
                        <BaseButton key={page}
                                    onClick={() => {
                                        setCurrentPage(page);
                                        onPageChange?.(page);
                                    }}
                                    variant="ghost"
                                    className={`!py-2 !px-2.5 min-w-9 !shadow-none md:text-sm font-normal ${currentPage === page ? '!border-gray-200' : ''}`}
                        >
                            {page}
                        </BaseButton>
                    )
                })}
            </div>
            <span className="px-1 text-gray-800 md:hidden text-xs md:text-base dark:text-white">/ {totalPages}</span>
            <BaseButton className="!py-2 !px-2.5 !shadow-none" onClick={() => {
                const next = Math.min(currentPage + 1, totalPages);
                setCurrentPage(next);
                onPageChange?.(next);
            }}
                        variant="ghost"
            >
                <span className="sr-only">다음 페이지로 이동</span>
                <ChevronRight className="size-4"/>
            </BaseButton>
            <BaseButton variant="ghost" className="!py-2 !px-2.5 !shadow-none"
                        onClick={() => {
                            setCurrentPage(totalPages);
                            onPageChange?.(totalPages);
                        }}
            >
                <span className="sr-only">마지막 페이지로 이동</span>
                <ChevronsRight className="size-4"/>
            </BaseButton>
        </nav>
    )
}