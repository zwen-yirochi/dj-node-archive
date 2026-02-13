import Link from 'next/link';
import { TopNav } from '@/components/cortex/TopNav';
import { AsciiDivider } from '@/components/cortex/AsciiDivider';
import { AsciiBox } from '@/components/cortex/AsciiBox';
import { Button } from '@/components/cortex/Button';
import { Footer } from '@/components/cortex/Footer';

export default function LandingPage() {
    return (
        <div className="mx-auto max-w-cortex px-4 md:px-cortex-gutter">
            <TopNav
                logo="DNA:"
                links={[
                    { label: 'Archive', href: '/' },
                    { label: 'Discovery', href: '/discover' },
                ]}
            />

            {/* ── Hero ── */}
            <section className="py-16 text-center md:py-24">
                <h1 className="font-mono-alt text-[32px] font-bold uppercase leading-none tracking-cortex-tight md:text-[56px]">
                    DJ Node Archive
                </h1>
                <p className="mx-auto mt-4 max-w-[520px] text-cortex-body text-cortex-ink-mid md:mt-6">
                    DJ를 위한 공연 기록 아카이브.
                    <br />
                    공연 히스토리를 기록하고, 함께한 아티스트들과 연결되세요.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link href="/login">
                        <Button>무료로 시작하기</Button>
                    </Link>
                    <Link href="/discover">
                        <Button variant="ghost">베뉴 탐색하기</Button>
                    </Link>
                </div>
            </section>

            <AsciiDivider text="WHY DNA" />

            {/* ── Features ── */}
            <section className="my-8">
                <div className="text-center">
                    <h2 className="font-mono-alt text-[20px] font-bold uppercase tracking-cortex-tight md:text-[28px]">
                        왜 DNA인가요?
                    </h2>
                    <p className="mt-2 text-cortex-body text-cortex-ink-mid">
                        DJ 커리어의 모든 순간을 기록하고 공유하세요
                    </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <AsciiBox>
                        <div className="text-center">
                            <div className="mb-2 text-cortex-label uppercase tracking-cortex-system text-cortex-ink-ghost">
                                * 01
                            </div>
                            <h3 className="text-sm font-semibold uppercase">공연 기록</h3>
                            <p className="mt-2 text-cortex-body text-cortex-ink-mid">
                                언제, 어디서 공연했는지 한눈에. 타임라인으로 정리된 나의 DJ
                                히스토리.
                            </p>
                        </div>
                    </AsciiBox>
                    <AsciiBox>
                        <div className="text-center">
                            <div className="mb-2 text-cortex-label uppercase tracking-cortex-system text-cortex-ink-ghost">
                                + 02
                            </div>
                            <h3 className="text-sm font-semibold uppercase">아티스트 연결</h3>
                            <p className="mt-2 text-cortex-body text-cortex-ink-mid">
                                함께 공연한 아티스트들과 자동으로 연결. 씬 내 네트워크를
                                시각화하세요.
                            </p>
                        </div>
                    </AsciiBox>
                    <AsciiBox>
                        <div className="text-center">
                            <div className="mb-2 text-cortex-label uppercase tracking-cortex-system text-cortex-ink-ghost">
                                + 03
                            </div>
                            <h3 className="text-sm font-semibold uppercase">쉬운 공유</h3>
                            <p className="mt-2 text-cortex-body text-cortex-ink-mid">
                                나만의 링크 하나로 모든 공연 기록을 공유. 프로모터, 팬들에게
                                보여주세요.
                            </p>
                        </div>
                    </AsciiBox>
                </div>
            </section>

            <AsciiDivider />

            {/* ── Discovery CTA ── */}
            <section className="py-8 text-center">
                <p className="text-cortex-label uppercase tracking-cortex-label text-cortex-ink-light">
                    베뉴를 탐색해보세요
                </p>
                <p className="mt-1 text-cortex-body text-cortex-ink-mid">
                    서울, 부산 등 한국 주요 도시의 클럽과 공연장을 둘러보세요
                </p>
                <div className="mt-4">
                    <Link href="/discover">
                        <Button>Discovery 바로가기</Button>
                    </Link>
                </div>
            </section>

            {/* ── Footer ── */}
            <Footer
                meta={['DJ-NODE-ARCHIVE // MODULE: LANDING']}
                bottom={{
                    left: 'DJ NODE ARCHIVE // 2025',
                    right: 'KR',
                }}
            />
        </div>
    );
}
