'use client';

import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// ============================================
// Crosshair
// ============================================
const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const CrosshairWrapper = styled.div<{ align: string }>`
    position: relative;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: ${(p) => (p.align === 'right' ? 'flex-end' : 'center')};
    padding: 0 20px;
    animation: ${fadeIn} 1s ease-out 0.5s both;
`;

const CrosshairIcon = styled.div`
    width: 12px;
    height: 12px;
    position: relative;

    &::before,
    &::after {
        content: '';
        position: absolute;
        background: rgba(0, 0, 0, 0.12);
    }

    &::before {
        width: 12px;
        height: 1px;
        top: 50%;
        left: 0;
    }

    &::after {
        width: 1px;
        height: 12px;
        left: 50%;
        top: 0;
    }
`;

const CrosshairDot = styled.div`
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.15);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
`;

interface CrosshairProps {
    position: 'right' | 'center';
}

export function Crosshair({ position }: CrosshairProps) {
    return (
        <CrosshairWrapper align={position}>
            <CrosshairIcon>
                <CrosshairDot />
            </CrosshairIcon>
        </CrosshairWrapper>
    );
}

// ============================================
// ScanLine
// ============================================
const drawLine = keyframes`
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
`;

const dotAppear = keyframes`
    from { opacity: 0; transform: scale(0); }
    to { opacity: 1; transform: scale(1); }
`;

const ScanLineWrapper = styled.div`
    position: relative;
    height: 32px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px;
`;

const Line = styled.div<{ delay: number }>`
    flex: 1;
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
    transform-origin: left;
    animation: ${drawLine} 0.8s ease-out ${(p) => p.delay}s both;
`;

const Dot = styled.div<{ delay: number }>`
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.15);
    animation: ${dotAppear} 0.3s ease-out ${(p) => p.delay + 0.6}s both;
`;

interface ScanLineProps {
    delay?: number;
}

export function ScanLine({ delay = 0 }: ScanLineProps) {
    return (
        <ScanLineWrapper>
            <Line delay={delay} />
            <Dot delay={delay} />
            <Line delay={delay + 0.1} />
            <Dot delay={delay} />
        </ScanLineWrapper>
    );
}

// ============================================
// SectionMarker (sidebar numbers)
// ============================================
const slideDown = keyframes`
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const MarkerWrapper = styled.div<{ offset: number }>`
    padding: 32px 12px;
    animation: ${slideDown} 0.6s ease-out ${(p) => 0.4 + p.offset * 0.2}s both;
`;

const SectionNumber = styled.div`
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
    color: rgba(0, 0, 0, 0.06);
    letter-spacing: -0.02em;
`;

const SectionMeta = styled.div`
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const MetaLabel = styled.div`
    font-size: 8px;
    letter-spacing: 0.1em;
    color: rgba(0, 0, 0, 0.2);
    text-transform: uppercase;
`;

const Arrow = styled.div`
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid rgba(0, 0, 0, 0.08);
    margin-top: 8px;
`;

interface SectionMarkerProps {
    number: string;
    offset: number;
}

export function SectionMarker({ number, offset }: SectionMarkerProps) {
    return (
        <MarkerWrapper offset={offset}>
            <SectionNumber>{number}</SectionNumber>
            <SectionMeta>
                <MetaLabel>SEC</MetaLabel>
                <MetaLabel>IDX.{number}</MetaLabel>
            </SectionMeta>
            <Arrow />
        </MarkerWrapper>
    );
}
