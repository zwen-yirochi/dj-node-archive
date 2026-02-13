import { EmotionRegistry } from '@/lib/emotion/registry';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return <EmotionRegistry>{children}</EmotionRegistry>;
}
