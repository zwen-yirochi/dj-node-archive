// src/app/actions/auth.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function loginWithGoogle() {
    const supabase = await createClient();
    const headersList = await headers();
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL;

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
