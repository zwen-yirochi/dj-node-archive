'use client';

import { Compass, ExternalLink, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

interface DashboardSidebarProps {
    username: string | null;
}

export default function DashboardSidebar({ username }: DashboardSidebarProps) {
    return (
        <aside className="flex h-screen w-64 flex-col border-r bg-stone-50">
            {/* 로고 */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="font-display text-2xl tracking-wide text-primary">
                    DNA
                </Link>
            </div>

            {/* 네비게이션 */}
            <nav className="flex-1 space-y-1 p-4">
                {/* Dashboard - 현재 페이지 (항상 active) */}
                <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                </div>

                {/* Discovery - 외부 링크 */}
                <Link
                    href="/discover"
                    target="_blank"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                    <Compass className="h-5 w-5" />
                    <span>Discovery</span>
                    <ExternalLink className="ml-auto h-4 w-4 text-stone-400" />
                </Link>
            </nav>

            {/* 하단: 내 페이지 링크 */}
            {username && (
                <div className="border-t p-4">
                    <Link
                        href={`/${username}`}
                        target="_blank"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                    >
                        <ExternalLink className="h-5 w-5" />
                        <span>내 페이지 보기</span>
                    </Link>
                </div>
            )}
        </aside>
    );
}
