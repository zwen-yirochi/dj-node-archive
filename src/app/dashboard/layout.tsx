import { getUser } from '@/app/actions/auth';
import Background from '@/components/Background';
import { findUserWithPagesById } from '@/lib/db/queries/user.queries';
import { redirect } from 'next/navigation';
import DashboardSidebar from './components/DashboardSidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const authUser = await getUser();

    if (!authUser) {
        redirect('/login');
    }

    // Get user's username for the sidebar
    const userResult = await findUserWithPagesById(authUser.id);
    const username = userResult.success ? userResult.data.username : null;

    return (
        <div className="flex min-h-screen">
            <DashboardSidebar username={username} />
            <Background src="/4fc8c0ade8e627922d94ad85cdf74555.jpg">
                <main className="h-full flex-1 overflow-y-auto">{children}</main>
            </Background>
        </div>
    );
}
