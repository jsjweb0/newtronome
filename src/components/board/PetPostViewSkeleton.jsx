export default function PetPostViewSkeleton() {
    return (
        <div className="max-w-[85rem] mx-auto px-4 animate-pulse">
            {/* 헤더 텍스트 */}
            <div className="py-8 border-y border-gray-200 dark:border-neutral-700 text-center">
                <div className="h-6 w-2/3 mx-auto bg-gray-200 rounded-md dark:bg-neutral-700" />
                <div className="flex justify-center gap-2 mt-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-6 w-16 bg-gray-200 rounded-full dark:bg-neutral-700" />
                    ))}
                </div>
            </div>

            {/* 이미지 슬라이더 자리 */}
            <div className="aspect-[4/3] mt-8 bg-gray-200 rounded-xl dark:bg-neutral-700" />

            {/* 버튼 자리 */}
            <div className="mt-6 text-center">
                <div className="inline-block h-10 w-40 bg-gray-200 rounded-md dark:bg-neutral-700" />
            </div>

            {/* 동물 정보 테이블 자리 */}
            <div className="mt-12 space-y-6">
                <div className="h-5 w-32 bg-gray-200 rounded dark:bg-neutral-700" />
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-4 w-full bg-gray-200 rounded dark:bg-neutral-700" />
                    ))}
                </div>
            </div>

            {/* 구조 정보 */}
            <div className="mt-12 space-y-6">
                <div className="h-5 w-32 bg-gray-200 rounded dark:bg-neutral-700" />
                <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-4 w-full bg-gray-200 rounded dark:bg-neutral-700" />
                    ))}
                </div>
            </div>

            {/* 보호소 정보 */}
            <div className="mt-12 space-y-6">
                <div className="h-5 w-32 bg-gray-200 rounded dark:bg-neutral-700" />
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-4 w-full bg-gray-200 rounded dark:bg-neutral-700" />
                    ))}
                </div>
            </div>

            {/* 하단 버튼 그룹 */}
            <div className="mt-12 flex justify-center">
                <div className="flex gap-4 bg-white dark:bg-neutral-800 shadow rounded-full py-3 px-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-5 w-5 bg-gray-200 rounded-full dark:bg-neutral-700" />
                    ))}
                </div>
            </div>

            {/* 목록 버튼 */}
            <div className="mt-8 flex justify-center">
                <div className="h-10 w-28 bg-gray-200 rounded dark:bg-neutral-700" />
            </div>
        </div>
    );
}
