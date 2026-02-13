import { TopNav } from '@/components/cortex/TopNav';
import { PathBar } from '@/components/cortex/PathBar';
import { SectionLabel } from '@/components/cortex/SectionLabel';
import { ImageFrame } from '@/components/cortex/ImageFrame';
import { StatsRow } from '@/components/cortex/StatsRow';
import { MetaTable } from '@/components/cortex/MetaTable';
import { TagCluster } from '@/components/cortex/TagCluster';
import { NodeItem } from '@/components/cortex/NodeItem';
import { Timeline } from '@/components/cortex/Timeline';
import { FreqGraph } from '@/components/cortex/FreqGraph';
import { AsciiDivider } from '@/components/cortex/AsciiDivider';
import { AsciiBox } from '@/components/cortex/AsciiBox';
import { Button } from '@/components/cortex/Button';
import { InputField } from '@/components/cortex/InputField';
import { UploadSlot } from '@/components/cortex/UploadSlot';
import { Footer } from '@/components/cortex/Footer';

// Demo frequency bars
const freqBars = Array.from({ length: 36 }, (_, i) => ({
    height: Math.round(((Math.sin(i * 0.5) + 1) / 2) * 80 + 10),
}));

export default function ArtistProfileDemo() {
    return (
        <div className="mx-auto max-w-cortex px-cortex-gutter">
            {/* TOP NAV */}
            <TopNav
                links={[
                    { label: 'Archive', href: '#' },
                    { label: 'Nodes', href: '#' },
                    { label: 'Artists', href: '#', active: true },
                    { label: 'Venues', href: '#' },
                    { label: 'Events', href: '#' },
                    { label: 'Map', href: '#' },
                ]}
                version="V2.4.1"
            />

            {/* PATH BAR */}
            <PathBar
                path="root / artists / kr-sel / ax-0847"
                meta="node type: artist // status: active"
            />

            {/* HERO: TEXT + IMAGE */}
            <section className="relative grid grid-cols-1 gap-cortex-gap pt-8 md:grid-cols-[1fr_380px]">
                <div
                    className="absolute bottom-0 top-8 hidden border-l border-dashed border-cortex-ink-ghost md:block"
                    style={{ left: 'calc(100% - 380px - 20px)' }}
                />

                <div className="md:pr-5">
                    <div className="mb-4 flex items-center gap-2.5 text-cortex-label uppercase tracking-cortex-label text-cortex-ink-light">
                        <span>Artist Node</span>
                        <span className="h-0 flex-1 border-t border-dotted border-cortex-ink-ghost" />
                    </div>

                    <h1 className="mb-1.5 font-mono-alt text-[32px] font-bold uppercase leading-none tracking-cortex-tight md:text-[44px]">
                        KAEL NOCTIS{' '}
                        <span className="font-mono-main text-[36px] font-normal text-cortex-ink-light">
                            (!)
                        </span>
                    </h1>
                    <div className="mb-7 text-cortex-meta-val tracking-[0.5px] text-cortex-ink-light">
                        aka NOCTIS_K — 케일 녹티스 — NOC.SYS
                    </div>

                    <p className="mb-5 max-w-[520px] text-cortex-body text-cortex-ink-mid">
                        서울 이태원 기반의 테크노 아티스트. 2019년부터 하드 테크노와 인더스트리얼
                        사운드를 중심으로 활동. Cakeshop, Faust 등 주요 베뉴에서의 레지던시를 통해
                        씬 내 입지를 구축. 글리치 비주얼과 결합한 라이브 퍼포먼스로 알려져 있으며,
                        베를린-서울 간 교류 프로젝트에 다수 참여.
                    </p>

                    <TagCluster
                        tags={[
                            { label: 'Techno', active: true },
                            { label: 'Hard Techno' },
                            { label: 'Industrial' },
                            { label: 'Live Act' },
                            { label: 'Resident' },
                            { label: 'Visual' },
                        ]}
                    />

                    <div className="my-4 flex items-center gap-5">
                        <span className="border-b border-dotted border-cortex-ink-ghost pb-0.5 text-cortex-label uppercase tracking-cortex-btn text-cortex-ink-light">
                            Listen
                        </span>
                        <div className="flex gap-5 text-cortex-meta-val font-medium uppercase tracking-cortex-system">
                            {['SoundCloud', 'RA', 'Spotify', 'Instagram'].map((name) => (
                                <a
                                    key={name}
                                    href="#"
                                    className="border-b border-dotted border-cortex-ink-ghost pb-px text-cortex-ink-mid no-underline hover:border-cortex-ink hover:text-cortex-ink"
                                >
                                    {name}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="my-4 flex gap-2">
                        <Button>Enroll Data</Button>
                        <Button variant="ghost">Report</Button>
                    </div>
                </div>

                <div>
                    <ImageFrame
                        src="https://images.unsplash.com/photo-1571266028243-3716f02d2d3e?w=600&q=80"
                        alt="Artist"
                        meta={{ left: 'IMG-0847-A // DUOTONE.V3', right: '2025.09.14' }}
                        priority
                    />
                </div>
            </section>

            {/* STATS */}
            <StatsRow
                stats={[
                    { number: '147', label: 'Events' },
                    { number: '23', label: 'Venues' },
                    { number: '89', label: 'Connections' },
                    { number: 'R.47', label: 'Revision' },
                ]}
            />

            {/* 2-COL: META + ACTIVITY */}
            <div className="relative grid grid-cols-1 gap-cortex-gap md:grid-cols-2">
                <div className="absolute bottom-0 left-1/2 top-0 hidden w-0 border-l border-dashed border-cortex-ink-ghost md:block" />

                <div className="relative z-[1]">
                    <SectionLabel right="SECT::01">Enrollment Metadata</SectionLabel>
                    <MetaTable
                        items={[
                            { key: 'Node ID', value: 'AX-0847' },
                            { key: 'Region', value: 'KR-SEL // ITAEWON' },
                            { key: 'Primary Genre', value: 'TECHNO' },
                            { key: 'Sub-Class', value: 'HARD / INDUSTRIAL' },
                            { key: 'Enrolled', value: '2023.03.14 // 14:27:09' },
                            { key: 'Status', value: 'ACTIVE' },
                            { key: 'Coordinates', value: '37.5340\u00B0N, 126.9948\u00B0E' },
                            { key: 'Protocol', value: 'CTX-ENROLL-V3' },
                            { key: 'Data Integrity', value: '0.9847' },
                            { key: 'Revision', value: 'R.047' },
                            { key: 'Checksum', value: '7f3a9b2e' },
                        ]}
                    />
                </div>

                <div className="relative z-[1]">
                    <SectionLabel right="GRAPH::01">Activity // 24M</SectionLabel>
                    <FreqGraph bars={freqBars} />

                    <div className="mt-6">
                        <SectionLabel right="SYS">Signal Status</SectionLabel>
                        <MetaTable
                            items={[
                                { key: 'Data Feed', value: 'ONLINE' },
                                { key: 'Last Sync', value: '2025.09.15 // 03:22:11' },
                                { key: 'Graph Depth', value: '3 / MAX:8' },
                                { key: 'Session', value: 'SES-4A7F2C91' },
                                { key: 'Mutation', value: '2025.09.14 // 22:47:30' },
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* ASCII DIVIDER */}
            <AsciiDivider text="NODE GRAPH" />

            {/* 2-COL: VENUES + ARTISTS */}
            <div className="relative grid grid-cols-1 gap-cortex-gap md:grid-cols-2">
                <div className="absolute bottom-0 left-1/2 top-0 hidden w-0 border-l border-dashed border-cortex-ink-ghost md:block" />

                <div className="relative z-[1]">
                    <SectionLabel right="NODE::VEN">Linked Venues</SectionLabel>
                    <div className="my-3">
                        <NodeItem
                            index={1}
                            type="VEN"
                            name="CAKESHOP"
                            detail="ITAEWON // VN-0312"
                            href="#"
                        />
                        <NodeItem
                            index={2}
                            type="VEN"
                            name="FAUST"
                            detail="MAPO // VN-0187"
                            href="#"
                        />
                        <NodeItem
                            index={3}
                            type="VEN"
                            name="://ABOUT BLANK"
                            detail="BERLIN // VN-2201"
                            href="#"
                        />
                        <NodeItem
                            index={4}
                            type="VEN"
                            name="VOLNOST"
                            detail="HAEBANGCHON // VN-0445"
                            href="#"
                        />
                    </div>
                </div>

                <div className="relative z-[1]">
                    <SectionLabel right="NODE::ART">Linked Artists</SectionLabel>
                    <div className="my-3">
                        <NodeItem
                            index={1}
                            type="ART"
                            name="VOIDKR"
                            detail="TECHNO / EBM"
                            href="#"
                        />
                        <NodeItem
                            index={2}
                            type="ART"
                            name="SUBTERRAIN"
                            detail="AMBIENT / DRONE"
                            href="#"
                        />
                        <NodeItem
                            index={3}
                            type="ART"
                            name="HEXCODE"
                            detail="HARD TECHNO"
                            href="#"
                        />
                        <NodeItem
                            index={4}
                            type="ART"
                            name="NULL.PTR"
                            detail="INDUSTRIAL"
                            href="#"
                        />
                    </div>
                </div>
            </div>

            {/* EVENT HISTORY */}
            <section className="my-7">
                <SectionLabel right="SECT::04">Event History</SectionLabel>
                <Timeline
                    entries={[
                        {
                            date: '2025.09.14 // SAT',
                            title: 'VOID PROTOCOL 004',
                            venue: 'CAKESHOP [VN-0312] // B2B w/ VOIDKR',
                            link: '#',
                        },
                        {
                            date: '2025.08.22 // FRI',
                            title: 'HARD SIGNAL: SEOUL x BERLIN',
                            venue: 'FAUST [VN-0187] // HEADLINER',
                            link: '#',
                        },
                        {
                            date: '2025.07.10 // SAT',
                            title: 'FRAGMENTED TRANSMISSIONS',
                            venue: '://ABOUT BLANK [VN-2201] // LIVE ACT',
                            link: '#',
                        },
                        {
                            date: '2025.06.01 // SAT',
                            title: 'CORTEX: SYSTEM OVERRIDE',
                            venue: 'CAKESHOP [VN-0312] // RESIDENT SET',
                            link: '#',
                        },
                        {
                            date: '2025.04.18 // FRI',
                            title: 'SUBTERRANEAN FREQUENCIES',
                            venue: 'VOLNOST [VN-0445] // B2B w/ SUBTERRAIN',
                            link: '#',
                        },
                    ]}
                />
            </section>

            {/* ASCII BOX: DATA ENROLLMENT */}
            <AsciiBox>
                <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="absolute bottom-0 left-1/2 top-0 hidden w-0 border-l border-dashed border-cortex-ink-ghost md:block" />

                    <div className="relative z-[1]">
                        <SectionLabel right="SECT::05">Data Enrollment</SectionLabel>
                        <UploadSlot />
                        <InputField
                            label="Display Name"
                            required
                            placeholder="Artist designation..."
                        />
                        <InputField label="Aliases" placeholder="Comma-separated..." />
                    </div>

                    <div className="relative z-[1]">
                        <SectionLabel right="TAGS">Classification</SectionLabel>
                        <InputField
                            label="Classification Tags"
                            placeholder="//TECHNO //HARD //INDUSTRIAL"
                            hint="Prefix each tag with //"
                        />
                        <InputField label="Region" placeholder="KR-SEL" />
                        <InputField
                            label="Bio Data"
                            multiline
                            placeholder="Textual data for this node..."
                        />
                        <div className="mt-4 flex gap-2">
                            <Button>Enroll Node</Button>
                            <Button variant="ghost">Save Draft</Button>
                        </div>
                    </div>
                </div>
            </AsciiBox>

            {/* FOOTER */}
            <Footer
                meta={[
                    'PROTOCOL: CTX-ARCHIVE-V2.4.1 // INTEGRITY: VERIFIED',
                    'SHA: 7f3a9b2e4d1c6f8a3b5e7d9c // REV: R.047',
                    'NODE_GRAPH_DEPTH: 3/8 // SESSION: SES-4A7F2C91',
                ]}
                ascii={`!.... .............     ............. ....!\n:.  :   : . :  .  :     :.  :   :. :  .  :\n!.... .............     ............. ....!`}
                bottom={{
                    left: 'CORTEX ARCHIVE // 2025',
                    center: 'ALL NODES RESERVED',
                    right: 'SECTOR-9 // KR',
                }}
            />
        </div>
    );
}
