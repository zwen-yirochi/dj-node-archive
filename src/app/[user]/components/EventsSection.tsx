import type { EventComponent } from '@/types';
import { Calendar } from 'lucide-react';
import EventCard from './EventCard';
import SectionHeader from './SectionHeader';

interface EventsSectionProps {
    events: EventComponent[];
}

export default function EventsSection({ events }: EventsSectionProps) {
    return (
        <section className="mt-6 px-4 sm:mt-8 sm:px-6 md:mt-12">
            <div className="mx-auto max-w-4xl">
                <SectionHeader
                    title="EVENTS"
                    count={events.length}
                    icon={<Calendar className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />}
                />

                <div className="space-y-4 sm:space-y-6">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>
        </section>
    );
}
1;
