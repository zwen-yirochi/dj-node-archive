import { JetBrains_Mono, Space_Mono } from 'next/font/google';
import Background from '@/components/Background';

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
            <Background
                src="/4fc8c0ade8e627922d94ad85cdf74555.jpg"
                priority={true}
                overlay="rgba(255,255,255,0.85)"
            >
                {children}
            </Background>
        </div>
    );
}
