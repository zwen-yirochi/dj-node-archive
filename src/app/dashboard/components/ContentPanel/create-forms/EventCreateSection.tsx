'use client';

import { useState } from 'react';

import {
    EVENT_CREATE_OPTIONS,
    type EventCreateOption,
} from '@/app/dashboard/config/workflowOptions';
import { Label } from '@/components/ui/label';
import OptionSelector from '@/components/ui/OptionSelector';

import CreateEventForm from './CreateEventForm';
import EventImportSearch from './EventImportSearch';

/** Event create section: Source selection (import/create) + render corresponding form */
export default function EventCreateSection() {
    const [option, setOption] = useState<EventCreateOption>('create');

    return (
        <>
            <div className="space-y-2">
                <Label className="text-dashboard-text-secondary">Source</Label>
                <OptionSelector
                    options={EVENT_CREATE_OPTIONS}
                    value={option}
                    onChange={setOption}
                />
            </div>
            {option === 'create' && <CreateEventForm />}
            {option === 'import' && <EventImportSearch />}
        </>
    );
}
