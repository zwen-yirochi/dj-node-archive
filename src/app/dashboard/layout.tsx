import Background from '@/components/Background';
import QueryProvider from '@/components/providers/QueryProvider';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <Background src="/4fc8c0ade8e627922d94ad85cdf74555.jpg" priority={true}>
                <main className="h-full flex-1 overflow-y-auto font-inter">{children}</main>
            </Background>
        </QueryProvider>
    );
}
