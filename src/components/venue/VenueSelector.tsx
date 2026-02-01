'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { VenueAutocomplete, type VenueAutocompleteProps } from './VenueAutocomplete';
import { CreateVenueModal } from './CreateVenueModal';
import type { DBVenueSearchResult } from '@/types/database';

export interface VenueSelectorProps extends Omit<VenueAutocompleteProps, 'onCreateNew'> {
    allowCreate?: boolean;
}

/**
 * VenueSelector - 베뉴 자동완성 + 새 베뉴 생성 기능을 결합한 컴포넌트
 *
 * @example
 * ```tsx
 * const [venue, setVenue] = useState<DBVenueSearchResult | null>(null);
 *
 * <VenueSelector
 *   value={venue}
 *   onChange={setVenue}
 *   allowCreate
 * />
 * ```
 */
export function VenueSelector({
    value,
    onChange,
    allowCreate = true,
    ...props
}: VenueSelectorProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [initialVenueName, setInitialVenueName] = useState('');

    const handleCreateNew = useCallback((searchQuery: string) => {
        setInitialVenueName(searchQuery);
        setIsCreateModalOpen(true);
    }, []);

    const handleVenueCreated = useCallback(
        (venue: DBVenueSearchResult) => {
            onChange(venue);
        },
        [onChange]
    );

    return (
        <>
            <VenueAutocomplete
                value={value}
                onChange={onChange}
                onCreateNew={allowCreate ? handleCreateNew : undefined}
                {...props}
            />

            {allowCreate && (
                <CreateVenueModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                    initialName={initialVenueName}
                    onCreated={handleVenueCreated}
                />
            )}
        </>
    );
}
