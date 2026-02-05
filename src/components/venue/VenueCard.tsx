'use client';

import Link from 'next/link';
import { MapPin, Instagram, Globe, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DBVenueSearchResult } from '@/types/database';

export interface VenueCardProps {
    venue: DBVenueSearchResult;
    className?: string;
}

export function VenueCard({ venue, className }: VenueCardProps) {
    return (
        <Card
            className={cn(
                'group overflow-hidden transition-all hover:border-primary/50 hover:shadow-md',
                className
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/venues/${venue.slug}`}
                            className="block truncate font-semibold text-foreground transition-colors group-hover:text-primary"
                        >
                            {venue.name}
                        </Link>
                        {venue.city && (
                            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>
                                    {venue.city}
                                    {venue.country && `, ${venue.country}`}
                                </span>
                            </div>
                        )}
                    </div>

                    {(venue.event_count ?? 0) > 0 && (
                        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            <Calendar className="h-3 w-3" />
                            <span>{venue.event_count}</span>
                        </div>
                    )}
                </div>

                {/* Social Links */}
                <div className="mt-3 flex items-center gap-2">
                    {venue.instagram && (
                        <a
                            href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Instagram className="h-3 w-3" />
                            <span>{venue.instagram}</span>
                        </a>
                    )}
                    {venue.website && (
                        <a
                            href={venue.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Globe className="h-3 w-3" />
                            <span>Website</span>
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
