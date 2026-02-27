'use client';

import {
    EVENT_CREATE_OPTIONS,
    type EventCreateOption,
} from '@/app/dashboard/config/workflowOptions';
import { Label } from '@/components/ui/label';
import OptionSelector from '@/components/ui/OptionSelector';
import { useState } from 'react';
import CreateEventForm from './CreateEventForm';
import EventImportSearch from './EventImportSearch';

/** Event 생성 섹션: Source 선택(import/create) + 해당 폼 렌더링 */
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
