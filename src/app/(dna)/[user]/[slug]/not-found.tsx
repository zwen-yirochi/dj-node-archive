import { DnaPageShell } from '@/components/dna/DnaPageShell';

export default function NotFound() {
    return (
        <DnaPageShell footerMeta={['DJ-NODE-ARCHIVE // 404']}>
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <span className="dna-text-system text-lg">// ENTRY NOT FOUND</span>
                <p className="text-dna-meta-val text-dna-ink-light">
                    요청하신 엔트리를 찾을 수 없습니다.
                </p>
            </div>
        </DnaPageShell>
    );
}
