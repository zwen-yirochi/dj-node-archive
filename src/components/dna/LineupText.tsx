import { Fragment } from 'react';
import Link from 'next/link';

export interface LineupArtist {
    name: string;
    linked?: boolean;
}

interface LineupTextProps {
    artists: LineupArtist[];
    fallback?: string;
}

export function LineupText({ artists, fallback }: LineupTextProps) {
    if (artists.length === 0) {
        return fallback ? <>{fallback}</> : null;
    }

    return (
        <>
            {artists.map((artist, i) => {
                const href = `/search/artists?q=${encodeURIComponent(artist.name)}`;
                return (
                    <Fragment key={i}>
                        {i > 0 && ', '}
                        <Link
                            href={href}
                            className={
                                artist.linked
                                    ? 'border-b border-dotted border-dna-accent-blue text-dna-accent-blue no-underline hover:border-solid'
                                    : 'text-inherit no-underline hover:text-dna-ink'
                            }
                        >
                            {artist.name}
                        </Link>
                    </Fragment>
                );
            })}
        </>
    );
}
