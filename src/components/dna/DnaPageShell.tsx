import { TopNav } from './TopNav';
import { PathBar } from './PathBar';
import { Footer } from './Footer';

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
        <div className="mx-auto max-w-dna px-4 md:px-dna-gutter">
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

            {children}

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
