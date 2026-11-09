const bone = 'bg-gray-200 dark:bg-neutral-700';

/** 게시글 상세(PostView)와 같은 배치의 로딩 화면: 목록 링크 · 본문 카드 · 이전/다음 글 */
export default function PostViewSkeleton() {
    return (
        <div className="w-full flex flex-col gap-4 md:gap-5 px-1 md:px-7 pb-6 animate-pulse" aria-hidden="true">
            <div className={`w-24 h-5 my-3 rounded ${bone}`} />

            <div className="rounded-2xl border border-line bg-surface px-4 pt-5 pb-4.5 md:px-8 md:pt-7 md:pb-6">
                <div className="flex flex-col gap-3 pb-4.5 border-b border-textThr/70">
                    <div className={`w-12 h-5 rounded-md ${bone}`} />
                    <div className={`w-3/4 h-7 md:h-8 rounded-lg ${bone}`} />
                    <div className="flex items-center gap-2.5">
                        <div className={`size-7.5 rounded-full ${bone}`} />
                        <div className={`w-20 h-3.5 rounded ${bone}`} />
                        <div className={`w-40 h-3.5 rounded ${bone}`} />
                    </div>
                </div>
                <div className="flex flex-col gap-3 py-6.5 pb-7.5">
                    <div className={`w-full h-4 rounded ${bone}`} />
                    <div className={`w-11/12 h-4 rounded ${bone}`} />
                    <div className={`w-4/5 h-4 rounded ${bone}`} />
                    <div className={`w-2/3 h-4 rounded ${bone}`} />
                </div>
                <div className="flex justify-center gap-2.5 pt-5 border-t border-textThr/70">
                    <div className={`w-20 h-11 rounded-full ${bone}`} />
                    <div className={`w-20 h-11 rounded-full ${bone}`} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2.5">
                <div className={`h-15 rounded-xl ${bone}`} />
                <div className={`max-md:hidden w-20 h-15 rounded-xl ${bone}`} />
                <div className={`h-15 rounded-xl ${bone}`} />
            </div>
        </div>
    );
}
