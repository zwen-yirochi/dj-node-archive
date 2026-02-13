import { findEventById } from '@/lib/db/queries/event.queries';
import { mapEventToDomain } from '@/lib/mappers';
import { notFound } from 'next/navigation';
import EventDetail from './components/EventDetail';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    const result = await findEventById(id);

    if (!result.success) {
        if (result.error.code === 'NOT_FOUND') {
            notFound();
        }
        throw new Error(result.error.message);
    }

    const event = mapEventToDomain(result.data);

    return (
        <div className="flex min-h-screen justify-center bg-[#0a0a0a]">
            <div className="relative min-h-screen w-full max-w-[390px] animate-fade-in overflow-x-hidden bg-[#0a0a0a] font-mono text-[#e5e5e5]">
                <EventDetail event={event} />
            </div>
        </div>
    );
}
