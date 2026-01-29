import DashboardSidebar from './components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid h-screen grid-cols-[280px_1fr] overflow-hidden">
            <aside className="overflow-y-auto border-r border-white/5 bg-stone-200">
                <DashboardSidebar />
            </aside>
            <main className="overflow-y-auto">{children}</main>
        </div>
    );
}
