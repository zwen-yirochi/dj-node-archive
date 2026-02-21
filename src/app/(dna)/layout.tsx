import { JetBrains_Mono, Space_Mono } from 'next/font/google';

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono-main',
    weight: ['300', '400', '500', '600', '700', '800'],
    display: 'swap',
});

const spaceMono = Space_Mono({
    subsets: ['latin'],
    variable: '--font-mono-alt',
    weight: ['400', '700'],
    display: 'swap',
});

export default function DnaLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className={`${jetbrainsMono.variable} ${spaceMono.variable} relative min-h-screen bg-dna-bg font-mono-main text-dna-ink`}
            style={{ fontSize: '13px' }}
        >
            {/* Noise texture overlay */}
            <div
                className="pointer-events-none fixed inset-0 z-[9999]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px',
                    opacity: 0.025,
                }}
            />
            {children}
        </div>
    );
}
