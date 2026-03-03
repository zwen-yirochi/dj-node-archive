// src/app/actions/auth.ts
'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function loginWithGoogle() {
    const supabase = await createClient();
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const origin = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_SITE_URL;

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/api/auth/callback`,
        },
    });

    if (error) {
        redirect('/login?error=oauth_failed');
    }

    if (data.url) {
        redirect(data.url);
    }
}

export async function loginAsGuest() {
    const email = process.env.DEMO_ACCOUNT_EMAIL;
    const password = process.env.DEMO_ACCOUNT_PASSWORD;

    if (!email || !password) {
        redirect('/login?error=guest_unavailable');
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        redirect('/login?error=guest_failed');
    }

    redirect('/dashboard');
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
}

export async function getUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}
