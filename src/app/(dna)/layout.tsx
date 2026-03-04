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
            className={`${jetbrainsMono.variable} ${spaceMono.variable} flex min-h-screen flex-col bg-dna-bg font-mono-main text-dna-ink`}
            style={{ fontSize: '13px' }}
        >
            {children}
        </div>
    );
}
