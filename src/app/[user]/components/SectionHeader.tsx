interface SectionHeaderProps {
    title: string;
    count?: number;
    icon: React.ReactNode;
}

export default function SectionHeader({ title, count, icon }: SectionHeaderProps) {
    return (
        <div className="mb-8 flex items-center gap-3">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-stone-500/20">
                {icon}
            </div>
            <h2 className="text-3xl font-bold tracking-wider md:text-4xl">{title}</h2>
            {count !== undefined && <span className="text-sm text-gray-500">({count})</span>}
        </div>
    );
}
