interface PostListSkeletonProps {
    rows?: number;
}

export default function PostListSkeleton({
    rows = 10,
}: PostListSkeletonProps) {
    return (
        <div className="animate-pulse flex flex-col gap-4 md:gap-5" aria-hidden="true">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-9.5 w-14 rounded-full bg-field" />
                    ))}
                </div>
                <div className="flex gap-2 max-md:w-full">
                    <div className="h-11 w-56 max-md:flex-1 rounded-xl bg-field" />
                    <div className="h-11 w-22 rounded-xl bg-field" />
                </div>
            </div>
            <div className="border-t border-textThr">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-[64px_minmax(0,1fr)_150px_96px_64px] items-center gap-x-4 gap-y-2 px-1.5 md:px-4 py-4 md:min-h-15 border-b border-line">
                        <div className="max-md:hidden h-3.5 w-6 mx-auto rounded bg-field" />
                        <div className="h-4 w-3/4 rounded bg-field" />
                        <div className="max-md:hidden h-3.5 w-20 rounded bg-field" />
                        <div className="max-md:hidden h-3.5 w-18 mx-auto rounded bg-field" />
                        <div className="max-md:hidden h-3.5 w-6 ml-auto rounded bg-field" />
                    </div>
                ))}
            </div>
        </div>
    );
}
