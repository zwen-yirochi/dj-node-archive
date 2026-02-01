'use client';

import { Compass, ExternalLink, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardSidebarProps {
    username: string | null;
}

export default function DashboardSidebar({ username }: DashboardSidebarProps) {
    const pathname = usePathname();

    const navItems = [
        {
            href: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
        },
        {
            href: '/dashboard/discovery',
            icon: Compass,
            label: 'Discovery',
        },
    ];

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
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
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
