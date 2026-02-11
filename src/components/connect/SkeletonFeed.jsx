export default function SkeletonFeed() {
    return (
        <div className="space-y-6">
            {[1, 2].map((i) => (
                <div key={i} className="glass-card rounded-xl overflow-hidden pb-4 animate-pulse">
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                            <div className="space-y-2">
                                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                                <div className="h-2 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                            </div>
                        </div>
                    </div>
                    <div className="w-full aspect-square sm:aspect-[4/3] bg-gray-200 dark:bg-gray-800" />
                    <div className="px-4 py-3 space-y-3">
                        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}
