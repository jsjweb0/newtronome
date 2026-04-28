import {SlidersHorizontal, Search, RefreshCcw} from "lucide-react";
import {Menu, MenuButton, MenuItem, MenuItems} from '@headlessui/react'
import AnimalKindFilter from "./AnimalKindFilter.jsx";
import AnimalRegionFilter from "./AnimalRegionFilter.jsx";
import SexFilter from "./SexFilter.jsx";
import StatusFilter from "./StatusFilter.jsx";

export default function SearchBar({
                                      searchKeyword, setSearchKeyword,
                                      filter,
                                      setFilter,
                                      regionCode,
                                      setRegionCode,
                                      regionOptions,
                                      sexFilter,
                                      setSexFilter,
                                      statusFilter,
                                      setStatusFilter,
                                      showOnlyLiked, setShowOnlyLiked
                                  }) {

    const appliedFilterCount = [
        filter !== "all",
        regionCode !== "",
        sexFilter !== "",
        statusFilter !== ""
    ].filter(Boolean).length;

    const handleResetFilters = () => {
        setFilter("all");
        setRegionCode("");
        setSexFilter("");
        setStatusFilter("");
    };

    return (
        <div className="w-full max-w-xl m-auto mt-4 md:mt-8 mb-5 text-center">
            <form>
                <div className="flex flex-row items-center gap-2 relative">
                    <div className="relative w-full">
                        <span className="flex items-center absolute inset-y-0 start-0 z-20 ps-3.5">
                            <Search className="shrink-0 size-4 text-gray-400 dark:text-white/60"/>
                        </span>
                        <input type="text"
                               className="py-2.5 sm:py-3 ps-10 pe-30 block w-full border border-gray-200 rounded-lg text-xs md:text-base focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                               title="검색어" placeholder="검색어를 입력하세요."
                               value={searchKeyword}
                               onChange={(e) => setSearchKeyword(e.target.value)}/>
                    </div>
                    <div className="shrink-0 absolute top-0 right-[3rem] z-20 h-full">
                        <Menu>
                            <MenuButton
                                className="flex items-center gap-x-1.5 w-full h-full py-2.5 px-4 rounded-lg text-xs md:text-sm text-gray-600 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden dark:text-neutral-400"

                            >
                                <SlidersHorizontal className="size-4"/>
                                검색조건
                                <span
                                    className="inline-block py-0.5 px-1.5 rounded-full bg-gray-800 text-center text-xs text-white dark:bg-neutral-500">
                                  {appliedFilterCount}
                                </span>
                            </MenuButton>
                            <MenuItems
                                transition
                                anchor="bottom end"
                                className={`transition-[opacity,translate] duration-200 opacity-100 data-closed:opacity-0 translate-y-2 data-closed:translate-0 w-[33rem] bg-white shadow-md rounded-lg dark:bg-neutral-800 dark:border dark:border-neutral-700 dark:divide-neutral-700
                                    `}>
                                <div className="px-4 py-4 space-y-0.5">
                                    <AnimalKindFilter filter={filter} setFilter={setFilter}/>
                                    <AnimalRegionFilter regionCode={regionCode} setRegionCode={setRegionCode}
                                                        regionOptions={regionOptions}/>
                                    <SexFilter sexFilter={sexFilter} setSexFilter={setSexFilter}/>
                                    <StatusFilter statusFilter={statusFilter} setStatusFilter={setStatusFilter}/>
                                </div>

                                <div className="absolute bottom-3 right-3">
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-x-1.5 text-sm text-gray-400 hover:text-blue-600"
                                    >
                                        <RefreshCcw className="size-4"/>
                                        필터 초기화
                                    </button>
                                </div>
                            </MenuItems>
                        </Menu>
                    </div>
                    <div className="group relative inline-flex items-center gap-x-3">
                        <label htmlFor="likeList" className="relative inline-block w-11 h-6 cursor-pointer">
                            <input type="checkbox" id="likeList" className="peer sr-only" checked={showOnlyLiked}
                                   onChange={() => setShowOnlyLiked(prev => !prev)}/>
                            <span
                                className="absolute inset-0 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out peer-checked:bg-blue-600 dark:bg-neutral-700 dark:peer-checked:bg-blue-500 peer-disabled:opacity-50 peer-disabled:pointer-events-none"></span>
                            <span
                                className="absolute top-1/2 start-0.5 -translate-y-1/2 size-5 bg-white rounded-full shadow-xs transition-transform duration-200 ease-in-out peer-checked:translate-x-full dark:bg-neutral-400 dark:peer-checked:bg-white"></span>
                        </label>
                        <div
                            className="transition-opacity inline-block absolute z-10 left-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible w-max mb-1 py-1 px-2 -translate-x-1/2 -translate-y-full bg-gray-900 text-xs font-medium text-white rounded-md shadow-2xs dark:bg-neutral-700"
                            role="tooltip">
                            좋아요 목록 보기
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
};