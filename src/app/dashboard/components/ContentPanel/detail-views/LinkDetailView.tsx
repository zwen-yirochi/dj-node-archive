'use client';

import { LINK_FIELD_BLOCKS } from '@/app/dashboard/config/fieldBlockConfig';

import IconBlock from './blocks/IconBlock';
import { TitleEditModal } from './EditModals';
import type { DetailViewProps } from './types';

export default function LinkDetailView({
    entry,
    onSave,
    editingField,
    onEditingDone,
    disabled,
}: DetailViewProps) {
    if (entry.type !== 'link') return null;

    const title = entry.title;

    return (
        <div className="space-y-6">
            {/* Header — 아이콘 + 제목 */}
            <div className="space-y-3 text-center">
                <IconBlock entry={entry} onSave={onSave} disabled={disabled} />
                <h2 className="text-xl font-bold text-dashboard-text">{title}</h2>
            </div>

            {/* Field blocks */}
            {LINK_FIELD_BLOCKS.map((block) => (
                <block.component
                    key={block.key}
                    entry={entry}
                    onSave={onSave}
                    disabled={disabled}
                />
            ))}

            {/* Edit Modals — Link는 TitleEditModal만 사용 */}
            {editingField === 'title' && (
                <TitleEditModal
                    value={title}
                    onSave={(newTitle) => {
                        onSave('title', newTitle);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
        </div>
    );
}
