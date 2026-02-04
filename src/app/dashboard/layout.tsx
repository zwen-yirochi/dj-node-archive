import { getUser } from '@/app/actions/auth';
import Background from '@/components/Background';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const authUser = await getUser();

    if (!authUser) {
        redirect('/login');
    }

    return (
        <Background src="/4fc8c0ade8e627922d94ad85cdf74555.jpg">
            <main className="h-full flex-1 overflow-y-auto font-inter">{children}</main>
        </Background>
    );
}
