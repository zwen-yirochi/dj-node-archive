import { getUser } from '@/app/actions/auth';
import { findUserWithPagesById } from '@/lib/db/queries/user.queries';
import { redirect } from 'next/navigation';
import DashboardHeader from './components/DashboardHeader';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const authUser = await getUser();

    if (!authUser) {
        redirect('/login');
    }

    // Get user's username for the header
    const userResult = await findUserWithPagesById(authUser.id);
    const username = userResult.success ? userResult.data.username : null;

    return (
        <div className="flex min-h-screen flex-col">
            <DashboardHeader username={username} />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}
