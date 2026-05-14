export default function Loading() {
    return (
        <div className="min-h-dvh bg-bg-main pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-28">
            {/* Header skeleton */}
            <div className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-5 lg:px-7">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="mb-1.5 h-8 w-32 animate-pulse rounded-xl bg-divider"/>
                        <div className="h-4 w-28 animate-pulse rounded-lg bg-divider"/>
                    </div>
                    <div className="mt-1 h-10 w-32 animate-pulse rounded-xl bg-divider"/>
                </div>
            </div>

            {/* Toolbar skeleton */}
            <div className="space-y-3 px-5 pb-5 lg:px-7">
                <div className="h-11 animate-pulse rounded-2xl bg-divider"/>
                <div className="flex items-center gap-2">
                    <div className="h-10 flex-1 animate-pulse rounded-[10px] bg-divider"/>
                    <div className="h-10 w-[76px] animate-pulse rounded-[10px] bg-divider"/>
                </div>
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-1 gap-4 px-5 sm:grid-cols-2 xl:grid-cols-3 lg:px-7">
                {Array.from({length: 6}).map((_, i) => (
                    <SkeletonCard key={i}/>
                ))}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="flex flex-col rounded-[18px] border border-divider bg-white p-5">
            {/* Top */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <div className="size-11 animate-pulse rounded-[13px] bg-divider"/>
                <div className="h-5 w-16 animate-pulse rounded-[8px] bg-divider"/>
            </div>
            {/* Title */}
            <div className="mb-1 h-5 w-3/4 animate-pulse rounded-lg bg-divider"/>
            <div className="mb-3 h-4 w-1/3 animate-pulse rounded-md bg-divider"/>
            {/* Progress */}
            <div className="mb-1 flex items-center justify-between">
                <div className="h-3 w-28 animate-pulse rounded bg-divider"/>
                <div className="h-3 w-8 animate-pulse rounded bg-divider"/>
            </div>
            <div className="mb-3 h-1 animate-pulse rounded-full bg-divider"/>
            {/* Footer */}
            <div className="mt-auto">
                <div className="mb-1.5 flex items-center justify-between">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-divider"/>
                </div>
                <div className="h-3 w-20 animate-pulse rounded bg-divider"/>
            </div>
        </div>
    );
}
