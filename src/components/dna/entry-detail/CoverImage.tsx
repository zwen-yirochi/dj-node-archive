import { ImageFrame } from '@/components/dna/ImageFrame';

interface CoverImageProps {
    src: string | undefined;
    alt: string;
}

export function CoverImage({ src, alt }: CoverImageProps) {
    return (
        <section className="pb-4 pt-6 md:pt-8">
            {src ? (
                <div className="mx-auto w-full md:max-w-[480px]">
                    <ImageFrame src={src} alt={alt} className="aspect-[3/4]" priority />
                </div>
            ) : (
                <div className="mx-auto flex aspect-[3/4] w-full items-center justify-center border border-dna-ink-faint bg-dna-bg-dark md:max-w-[480px]">
                    <span className="dna-text-system">// NO IMAGE</span>
                </div>
            )}
        </section>
    );
}
