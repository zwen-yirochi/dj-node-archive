import { AsciiBox } from '@/components/dna/AsciiBox';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <AsciiBox>
                <p className="dna-text-body text-center">
                    // VENUE NOT FOUND — 베뉴를 찾을 수 없습니다
                </p>
            </AsciiBox>
        </div>
    );
}
