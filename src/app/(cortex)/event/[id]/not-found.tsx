import { AsciiBox } from '@/components/cortex/AsciiBox';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <AsciiBox>
                <p className="text-center text-cortex-body text-cortex-ink-mid">
                    // EVENT NOT FOUND — 이벤트를 찾을 수 없습니다
                </p>
            </AsciiBox>
        </div>
    );
}
