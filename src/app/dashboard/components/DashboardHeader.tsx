'use client';

import { Compass, LayoutDashboard, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
    username: string | null;
}

export default function DashboardHeader({ username }: DashboardHeaderProps) {
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

    const handleLogout = async () => {
        await logout();
    };

    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* 로고 */}
                <Link href="/" className="font-display text-2xl tracking-wide text-primary">
                    DNA
                </Link>

                {/* 네비게이션 */}
                <nav className="flex items-center gap-1">
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
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* 우측 메뉴 */}
                <div className="flex items-center gap-2">
                    {username && (
                        <Link href={`/${username}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">내 페이지</span>
                            </Button>
                        </Link>
                    )}
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-destructive"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">로그아웃</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
