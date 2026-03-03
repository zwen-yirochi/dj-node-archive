// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/**/*.stories.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                surface: {
                    DEFAULT: 'hsl(var(--surface))',
                    foreground: 'hsl(var(--surface-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))',
                },
                text: {
                    primary: 'rgb(66 52 60 / <alpha-value>)',
                    secondary: '#666666',
                    tertiary: '#999999',
                    inverse: '#ffffff',
                    muted: '#d1d5db',
                },
                // DNA Design System
                dna: {
                    bg: 'rgb(226, 230, 231)',
                    'bg-tint': 'rgb(218, 222, 224)',
                    'bg-dark': 'rgb(208, 212, 214)',
                    ink: '#1a1a1e',
                    'ink-mid': '#4a4a52',
                    'ink-light': '#7a7a86',
                    'ink-ghost': '#a0a0ac',
                    'ink-faint': '#c0c0c8',
                    'accent-red': '#c0392b',
                    'accent-blue': '#2255aa',
                },
                // Dashboard Design System - Light Theme
                dashboard: {
                    // Backgrounds
                    bg: {
                        DEFAULT: 'rgb(250 250 250)', // neutral-50
                        surface: 'rgb(245 245 245 / 0.9)', // neutral-100/90
                        card: 'rgb(245 245 245 / 0.9)', // neutral-100/90
                        hover: 'rgb(229 229 229 / 0.5)', // neutral-200/50
                        active: 'rgb(229 229 229)', // neutral-200
                        muted: 'rgb(245 245 245)', // neutral-100
                    },
                    // Text colors
                    text: {
                        DEFAULT: 'rgb(23 23 23)', // neutral-900
                        secondary: 'rgb(64 64 64)', // neutral-700
                        muted: 'rgb(115 115 115)', // neutral-500
                        placeholder: 'rgb(163 163 163)', // neutral-400
                    },
                    // Border colors
                    border: {
                        DEFAULT: 'rgb(229 229 229)', // neutral-200
                        muted: 'rgb(245 245 245)', // neutral-100
                        hover: 'rgb(212 212 212)', // neutral-300
                    },
                    // Component type colors
                    type: {
                        event: 'rgb(59 130 246)', // blue-500
                        mixset: 'rgb(168 85 247)', // purple-500
                        link: 'rgb(34 197 94)', // green-500
                    },
                },
            },
            fontFamily: {
                // Dashboard UI용 (가독성, 다양한 웨이트)
                inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                // 아트워크/공개 페이지용
                stripe: ['var(--font-stripe)', 'sans-serif'],
                nyangi: ['var(--font-nyangi)', 'sans-serif'],
                bokeh: ['var(--font-bokeh)', 'sans-serif'],
                // DNA monospace
                'mono-main': ["'JetBrains Mono'", 'monospace'],
                'mono-alt': ["'Space Mono'", 'monospace'],
                // DNA pixel
                dotso: ['var(--font-dotso)', 'monospace'],
                // 기본 시스템
                sans: ['var(--font-geist-sans)', 'sans-serif'],
                mono: ['var(--font-geist-mono)', 'monospace'],
            },
            letterSpacing: {
                'dna-tight': '-1px',
                'dna-input': '0.3px',
                'dna-detail': '0.5px',
                'dna-system': '1px',
                'dna-meta': '1.5px',
                'dna-btn': '2px',
                'dna-label': '2.5px',
            },
            fontSize: {
                'dna-system': ['8px', { lineHeight: '1.4' }],
                'dna-label': ['9px', { lineHeight: '1.4' }],
                'dna-ui': ['10px', { lineHeight: '1.4' }],
                'dna-meta-val': ['11px', { lineHeight: '1.6' }],
                'dna-body': ['12px', { lineHeight: '1.75' }],
                'dna-item': ['13px', { lineHeight: '1.4' }],
            },
            maxWidth: {
                dna: '1080px',
            },
            spacing: {
                'dna-gutter': '32px',
                'dna-gap': '40px',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            transformStyle: {
                '3d': 'preserve-3d',
            },
            backfaceVisibility: {
                hidden: 'hidden',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'fade-in-up': {
                    from: { opacity: '0', transform: 'translateY(16px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'accent-pulse': {
                    '0%, 100%': { opacity: '0.6' },
                    '50%': { opacity: '1' },
                },
                'draw-line': {
                    from: { transform: 'scaleX(0)' },
                    to: { transform: 'scaleX(1)' },
                },
                'dot-appear': {
                    from: { opacity: '0', transform: 'scale(0)' },
                    to: { opacity: '1', transform: 'scale(1)' },
                },
                'slide-down': {
                    from: { opacity: '0', transform: 'translateY(-8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.8s ease-out',
                'fade-in-up': 'fade-in-up 0.5s ease-out both',
                'accent-pulse': 'accent-pulse 3s ease-in-out infinite',
                'draw-line': 'draw-line 0.8s ease-out both',
                'dot-appear': 'dot-appear 0.3s ease-out both',
                'slide-down': 'slide-down 0.6s ease-out both',
                'fade-in-slow': 'fade-in 1s ease-out 0.5s both',
                'fade-in-view': 'fade-in 150ms ease-in-out',
            },
            textShadow: {
                xs: '0px 0px 2px color-mix(in srgb, currentColor 40%, transparent)',
                sm: '0px 0px 3px color-mix(in srgb, currentColor 50%, transparent)',
                def: '0px 0px 4px color-mix(in srgb, currentColor 60%, transparent)',
                md: '0px 0px 5px color-mix(in srgb, currentColor 65%, transparent)',
                lg: '0px 0px 6px color-mix(in srgb, currentColor 60%, transparent)',
                xl: '0px 0px 8px color-mix(in srgb, currentColor 75%, transparent)',
                '2xl': '0px 0px 12px color-mix(in srgb, currentColor 80%, transparent)',
                '3xl': '0px 0px 16px color-mix(in srgb, currentColor 85%, transparent)',
            },
        },
    },
    plugins: [require('tailwindcss-animate'), require('tailwindcss-textshadow')],
};

export default config;
