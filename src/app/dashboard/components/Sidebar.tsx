'use client';

import { BarChart3, LayoutDashboard, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardSidebar() {
    const pathname = usePathname();

    const navItems = [
        {
            href: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
        },
        {
            href: '/dashboard/analytics',
            icon: BarChart3,
            label: 'Analytics',
            badge: 'Soon',
        },
        {
            href: '/dashboard/settings',
            icon: Settings,
            label: 'Settings',
            badge: 'Soon',
        },
    ];

    return (
        <div className="flex h-full flex-col border-r-2 border-gray-500">
            {/* 로고 */}
            <div className="p-6">
                <h1 className="font-display text-3xl tracking-wide text-primary">DNA</h1>
            </div>

            {/* 네비게이션 */}
            <nav className="flex-1 p-2 pt-0">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all ${
                                        isActive
                                            ? 'bg-gray-400 text-white'
                                            : 'text-primary hover:bg-gray-300 hover:bg-white/5'
                                    } `}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* 하단 */}
            <div className="space-y-2 border-t border-white/5 p-4">
                <Link
                    href="/dj-xxx"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 font-medium text-[#71717a] transition-all hover:bg-white/5 hover:text-[#fafaf9]"
                >
                    <User className="h-5 w-5" />
                    <span>내 페이지 보기</span>
                </Link>
            </div>
        </div>
    );
}
