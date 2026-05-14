export function ComparatorLoadingSkeleton() {
    return (
        <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)_18rem]">
            <div className="rounded-3xl border border-divider bg-white p-4 shadow-[0_10px_34px_rgba(31,42,36,0.06)]">
                <div className="mb-4 h-5 w-32 animate-pulse rounded-full bg-bg-hover"/>
                <div className="space-y-3">
                    {Array.from({length: 5}).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded-3xl bg-bg-main"/>
                    ))}
                </div>
            </div>
            <div className="rounded-3xl border border-divider bg-white p-5 shadow-[0_10px_34px_rgba(31,42,36,0.06)]">
                <div className="h-18 animate-pulse rounded-3xl bg-bg-main"/>
                <div className="mt-5 space-y-3">
                    {Array.from({length: 5}).map((_, index) => (
                        <div key={index} className="h-17 animate-pulse rounded-3xl bg-bg-main"/>
                    ))}
                </div>
            </div>
            <div className="rounded-3xl border border-divider bg-white p-5 shadow-[0_10px_34px_rgba(31,42,36,0.06)]">
                <div className="h-5 w-40 animate-pulse rounded-full bg-bg-hover"/>
                <div className="mt-5 space-y-3">
                    <div className="h-28 animate-pulse rounded-3xl bg-bg-main"/>
                    <div className="h-24 animate-pulse rounded-3xl bg-bg-main"/>
                    <div className="h-24 animate-pulse rounded-3xl bg-bg-main"/>
                </div>
            </div>
        </div>
    );
}
