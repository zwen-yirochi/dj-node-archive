import { AsciiBox } from '@/components/cortex/AsciiBox';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <AsciiBox>
                <p className="text-center text-cortex-body text-cortex-ink-mid">
                    // NODE NOT FOUND — 사용자를 찾을 수 없습니다
                </p>
            </AsciiBox>
        </div>
    );
}
