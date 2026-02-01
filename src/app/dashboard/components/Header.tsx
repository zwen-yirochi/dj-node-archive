import { logout } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

export function Header() {
    return (
        <header className="mb-12 flex items-start justify-between border-b border-white/5 p-0">
            <div>
                <h1 className="font-display text-4xl text-primary">Dashboard</h1>
            </div>
            <form action={logout}>
                <button
                    type="submit"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </form>
        </header>
    );
}
