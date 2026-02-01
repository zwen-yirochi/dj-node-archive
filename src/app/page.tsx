import Link from 'next/link';
import { ArrowRight, Compass, Calendar, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="font-display text-2xl tracking-wide">
                        DNA
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/discover">
                            <Button variant="ghost" size="sm">
                                <Compass className="mr-2 h-4 w-4" />
                                Discovery
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="ghost" size="sm">
                                로그인
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="sm">
                                시작하기
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                        DJ Node Archive
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                        DJ를 위한 공연 기록 아카이브.
                        <br />
                        공연 히스토리를 기록하고, 함께한 아티스트들과 연결되세요.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/login">
                            <Button size="lg" className="w-full sm:w-auto">
                                무료로 시작하기
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/discover">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                <Compass className="mr-2 h-4 w-4" />
                                베뉴 탐색하기
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="border-t bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <h2 className="text-center text-3xl font-bold">왜 DNA인가요?</h2>
                    <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
                        DJ 커리어의 모든 순간을 기록하고 공유하세요
                    </p>

                    <div className="mt-12 grid gap-8 md:grid-cols-3">
                        <FeatureCard
                            icon={Calendar}
                            title="공연 기록"
                            description="언제, 어디서 공연했는지 한눈에. 타임라인으로 정리된 나의 DJ 히스토리."
                        />
                        <FeatureCard
                            icon={Users}
                            title="아티스트 연결"
                            description="함께 공연한 아티스트들과 자동으로 연결. 씬 내 네트워크를 시각화하세요."
                        />
                        <FeatureCard
                            icon={Share2}
                            title="쉬운 공유"
                            description="나만의 링크 하나로 모든 공연 기록을 공유. 프로모터, 팬들에게 보여주세요."
                        />
                    </div>
                </div>
            </section>

            {/* Discovery CTA */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12">
                        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                            <div>
                                <h2 className="text-2xl font-bold md:text-3xl">
                                    베뉴를 탐색해보세요
                                </h2>
                                <p className="mt-2 text-muted-foreground">
                                    서울, 부산 등 한국 주요 도시의 클럽과 공연장을 둘러보세요
                                </p>
                            </div>
                            <Link href="/discover">
                                <Button size="lg">
                                    <Compass className="mr-2 h-4 w-4" />
                                    Discovery 바로가기
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="font-display text-xl tracking-wide">DNA</div>
                        <p className="text-sm text-muted-foreground">
                            © 2026 DJ Node Archive. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href="/discover"
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                Discovery
                            </Link>
                            <Link
                                href="/login"
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                로그인
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
