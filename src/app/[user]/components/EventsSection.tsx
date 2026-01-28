import { EventData } from '@/app/types';
import EventCard from './EventCard';
import SectionHeader from './SectionHeader';

interface EventsSectionProps {
    events: EventData[];
}

export default function EventsSection({ events }: EventsSectionProps) {
    const calendarIcon = (
        <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
        </svg>
    );

    return (
        <section className="mt-12 px-6">
            <div className="mx-auto max-w-4xl">
                <SectionHeader title="EVENTS" count={events.length} icon={calendarIcon} />

                <div className="space-y-6">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>
        </section>
    );
}
