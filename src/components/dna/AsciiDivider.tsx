import { cn } from '@/lib/utils';

interface AsciiDividerProps {
    text?: string;
    className?: string;
}

export function AsciiDivider({ text, className }: AsciiDividerProps) {
    const topBottom =
        '/- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -\\';
    const empty =
        '|                                                                                 |';

    return (
        <div
            className={cn(
                'select-none overflow-hidden whitespace-pre py-6 text-center text-dna-meta-val leading-[1.4] text-dna-ink-ghost',
                className
            )}
        >
            {text ? (
                <>
                    {topBottom}
                    {'\n'}
                    {empty}
                    {'\n'}
                    {`|${text.padStart((81 + text.length) / 2).padEnd(81)}|`}
                    {'\n'}
                    {empty}
                    {'\n'}
                    {
                        '\\- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -/'
                    }
                </>
            ) : (
                <>
                    {topBottom}
                    {'\n'}
                    {empty}
                    {'\n'}
                    {
                        '\\- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -/'
                    }
                </>
            )}
        </div>
    );
}
