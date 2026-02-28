export default function Skeleton() {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* 사이드바 */}
            <div className="p-3">
                <div className="h-full w-[240px] animate-pulse rounded-2xl bg-dashboard-bg-card" />
            </div>

            {/* 메인 + 프리뷰 */}
            <div className="flex flex-1 gap-6 overflow-hidden p-3 pl-2">
                <div className="flex-1 animate-pulse rounded-2xl bg-dashboard-bg-card" />
                <div className="w-[400px] animate-pulse rounded-2xl" />
            </div>
        </div>
    );
}
