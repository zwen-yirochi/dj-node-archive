/**
 * 에디터 컴포넌트 레지스트리
 * - EntryEditorProps 공통 인터페이스
 * - 타입별 에디터 컴포넌트 매핑
 */

import type { ComponentType } from 'react';
import type { ContentEntry } from '@/types';
import type { EntryType } from './entryConfig';
import EventEditor from '../components/ContentPanel/editors/EventEditor';
import MixsetEditor from '../components/ContentPanel/editors/MixsetEditor';
import LinkEditor from '../components/ContentPanel/editors/LinkEditor';

export interface EntryEditorProps {
    entry: ContentEntry;
    onUpdate: (updates: Partial<ContentEntry>) => void;
    editingField: 'title' | 'image' | null;
    onEditingDone: () => void;
}

export const EDITOR_REGISTRY: Record<EntryType, ComponentType<EntryEditorProps>> = {
    event: EventEditor,
    mixset: MixsetEditor,
    link: LinkEditor,
};
