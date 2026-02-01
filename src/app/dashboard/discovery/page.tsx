import { DiscoveryContent } from '@/components/discovery/DiscoveryContent';

export default function DashboardDiscoveryPage() {
    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Discovery</h1>
                <p className="mt-1 text-muted-foreground">
                    베뉴를 탐색하고 새로운 장소를 발견하세요
                </p>
            </div>

            <DiscoveryContent />
        </div>
    );
}
