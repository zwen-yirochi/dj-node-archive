import { Suspense } from 'react';

import PreviewMessageListener from './components/PreviewMessageListener';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={null}>
                <PreviewMessageListener />
            </Suspense>
            {children}
        </>
    );
}
