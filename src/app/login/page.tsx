// src/app/login/page.tsx
import type { Metadata } from 'next';

import { loginAsGuest, loginWithGoogle } from '@/app/actions/auth';

export const metadata: Metadata = {
    title: 'Login - DJ Archive',
    description: 'Sign in to manage your DJ archive',
};

interface LoginPageProps {
    searchParams: Promise<{
        error?: string;
        redirectTo?: string;
    }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { error } = await searchParams;

    return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <div className="w-full max-w-md space-y-8 rounded-lg border border-white/10 bg-white/5 p-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">DJ Archive</h1>
                    <p className="mt-2 text-gray-400">Sign in to manage your archive</p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-500/10 p-4 text-center text-sm text-red-400">
                        {error === 'auth_failed'
                            ? 'Authentication failed. Please try again.'
                            : error === 'oauth_failed'
                              ? 'OAuth login failed. Please try again.'
                              : error === 'guest_unavailable'
                                ? 'Guest login is not available.'
                                : error === 'guest_failed'
                                  ? 'Guest login failed. Please try again.'
                                  : 'An error occurred. Please try again.'}
                    </div>
                )}

                <form action={loginWithGoogle} className="mt-8">
                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>
                </form>

                {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
                    <form action={loginAsGuest}>
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                        >
                            Try as Guest
                        </button>
                    </form>
                )}

                <p className="text-center text-xs text-gray-500">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}
