import { getUser } from '@/app/actions/auth';
import { findUserWithPagesById } from '@/lib/db/queries/user.queries';
import { redirect } from 'next/navigation';
import DashboardSidebar from './components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const authUser = await getUser();

    if (!authUser) {
        redirect('/login');
    }

    // Get user's username for the sidebar
    const userResult = await findUserWithPagesById(authUser.id);
    const username = userResult.success ? userResult.data.username : null;

    return (
        <div className="grid h-screen grid-cols-[280px_1fr] overflow-hidden">
            <aside className="overflow-y-auto border-r border-white/5 bg-stone-200">
                <DashboardSidebar username={username} />
            </aside>
            <main className="overflow-y-auto">{children}</main>
        </div>
    );
}
