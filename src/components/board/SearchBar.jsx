import { BaseButton } from "../ui/BaseButton.jsx";
import { Search } from "lucide-react";

export default function SearchBar({ searchKeyword, setSearchKeyword}) {
    return (
        <div className="w-full max-w-xl m-auto mt-4 md:mt-8 mb-5 text-center">
            <form>
                <div className="flex flex-row items-center gap-2 sm:">
                    <div className="relative w-full">
                        <span className="flex items-center absolute inset-y-0 start-0 z-20 ps-3.5">
                            <Search className="shrink-0 size-4 text-gray-400 dark:text-white/60" />
                        </span>
                        <input type="text"
                               className="py-2.5 sm:py-3 ps-10 pe-4 block w-full border border-gray-200 rounded-lg text-xs md:text-base focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                               title="검색어" placeholder="검색어를 입력하세요."
                               value={searchKeyword}
                               onChange={(e) => setSearchKeyword(e.target.value)}/>
                    </div>
                    <BaseButton variant="primary">검색</BaseButton>
                </div>
            </form>
        </div>
    )
};