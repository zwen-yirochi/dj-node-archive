import Link from 'next/link';
import { DnaPageShell } from '@/components/dna/DnaPageShell';
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { AsciiBox } from '@/components/dna/AsciiBox';
import { Button } from '@/components/dna/Button';

export default function LandingPage() {
    return (
        <DnaPageShell footerMeta={['DJ-NODE-ARCHIVE // MODULE: LANDING']}>
            {/* ── Hero ── */}
            <section className="py-16 text-center md:py-24">
                <h1 className="dna-heading-hero">DJ Node Archive</h1>
                <p className="dna-text-body mx-auto mt-4 max-w-[520px] md:mt-6">
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
                    <h2 className="dna-heading-section">왜 DNA인가요?</h2>
                    <p className="dna-text-body mt-2">
                        DJ 커리어의 모든 순간을 기록하고 공유하세요
                    </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <AsciiBox>
                        <div className="text-center">
                            <div className="dna-text-system mb-2">* 01</div>
                            <h3 className="text-sm font-semibold uppercase">공연 기록</h3>
                            <p className="dna-text-body mt-2">
                                언제, 어디서 공연했는지 한눈에. 타임라인으로 정리된 나의 DJ
                                히스토리.
                            </p>
                        </div>
                    </AsciiBox>
                    <AsciiBox>
                        <div className="text-center">
                            <div className="dna-text-system mb-2">+ 02</div>
                            <h3 className="text-sm font-semibold uppercase">아티스트 연결</h3>
                            <p className="dna-text-body mt-2">
                                함께 공연한 아티스트들과 자동으로 연결. 씬 내 네트워크를
                                시각화하세요.
                            </p>
                        </div>
                    </AsciiBox>
                    <AsciiBox>
                        <div className="text-center">
                            <div className="dna-text-system mb-2">+ 03</div>
                            <h3 className="text-sm font-semibold uppercase">쉬운 공유</h3>
                            <p className="dna-text-body mt-2">
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
                <p className="dna-text-node">베뉴를 탐색해보세요</p>
                <p className="dna-text-body mt-1">
                    서울, 부산 등 한국 주요 도시의 클럽과 공연장을 둘러보세요
                </p>
                <div className="mt-4">
                    <Link href="/discover">
                        <Button>Discovery 바로가기</Button>
                    </Link>
                </div>
            </section>
        </DnaPageShell>
    );
}
