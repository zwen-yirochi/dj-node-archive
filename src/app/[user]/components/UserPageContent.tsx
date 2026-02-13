'use client';

import type { ContentEntry, User } from '@/types/domain';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Crosshair, ScanLine, SectionMarker } from './Decorations';
import EntryCard from './EntryCard';
import ProfileHeader from './ProfileHeader';
import ShareButton from './ShareButton';

interface Props {
    user: User;
    entries: ContentEntry[];
}

const MOBILE_WIDTH = '390px';

// -- Animations --
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

// -- Styled Components --
const DeviceFrame = styled.div`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    background: #d6d3ce;
`;

const PageWrapper = styled.div`
    width: 100%;
    max-width: ${MOBILE_WIDTH};
    min-height: 100vh;
    background: #f0ede8;
    color: #1a1a1a;
    font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
    animation: ${fadeIn} 0.8s ease-out;
    position: relative;
    overflow-x: hidden;
`;

const ContentLayout = styled.div`
    display: grid;
    grid-template-columns: 1fr 48px;
    padding: 0 16px;
`;

const MainColumn = styled.main`
    min-width: 0;
`;

const SideColumn = styled.aside`
    position: relative;
    border-left: 1px solid rgba(0, 0, 0, 0.08);
`;

const EntryGroup = styled.section`
    position: relative;
`;

const Spacer = styled.div`
    height: 48px;
`;

const ShareRow = styled.div`
    display: flex;
    justify-content: flex-end;
    padding: 0 16px 16px;
`;

export default function UserPageContent({ user, entries }: Props) {
    const groups: ContentEntry[][] = [];
    for (let i = 0; i < entries.length; i += 3) {
        groups.push(entries.slice(i, i + 3));
    }

    return (
        <DeviceFrame>
            <PageWrapper>
                <ShareRow>
                    <ShareButton />
                </ShareRow>
                <ProfileHeader {...user} />
                <ContentLayout>
                    <MainColumn>
                        {groups.map((group, gi) => (
                            <EntryGroup key={gi}>
                                <ScanLine delay={gi * 0.3} />
                                {group.map((entry, ei) => (
                                    <EntryCard key={entry.id} entry={entry} index={gi * 3 + ei} />
                                ))}
                                <Crosshair position={gi % 2 === 0 ? 'right' : 'center'} />
                            </EntryGroup>
                        ))}
                        <Spacer />
                    </MainColumn>
                    <SideColumn>
                        {groups.map((_, gi) => (
                            <SectionMarker
                                key={gi}
                                number={String(gi + 1).padStart(2, '0')}
                                offset={gi}
                            />
                        ))}
                    </SideColumn>
                </ContentLayout>
            </PageWrapper>
        </DeviceFrame>
    );
}
