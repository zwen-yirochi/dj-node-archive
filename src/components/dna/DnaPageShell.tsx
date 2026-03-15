import { Footer } from './Footer';
import { PathBar } from './PathBar';
import { TopNav } from './TopNav';

interface DnaPageShellProps {
    activeLink?: 'archive' | 'discover';
    pathBar?: { path: string; meta?: string };
    footerMeta: string[];
    footerRight?: string;
    children: React.ReactNode;
}

export function DnaPageShell({
    activeLink,
    pathBar,
    footerMeta,
    footerRight = 'KR',
    children,
}: DnaPageShellProps) {
    return (
        <div className="mx-auto flex min-h-screen w-full max-w-dna flex-col px-4 md:px-dna-gutter">
            <TopNav
                logo="DNA:"
                links={[
                    { label: 'Archive', href: '/', active: activeLink === 'archive' },
                    { label: 'Discovery', href: '/discover', active: activeLink === 'discover' },
                ]}
            />

            {pathBar && (
                <div className="hidden md:block">
                    <PathBar path={pathBar.path} meta={pathBar.meta} />
                </div>
            )}

            <div className="min-w-0 flex-1">{children}</div>

            <Footer
                meta={footerMeta}
                bottom={{
                    left: 'DJ NODE ARCHIVE // 2025',
                    right: footerRight,
                }}
            />
        </div>
    );
}
