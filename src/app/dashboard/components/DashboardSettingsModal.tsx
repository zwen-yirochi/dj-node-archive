'use client';

import {
    selectIsSettingsOpen,
    selectSetSettingsOpen,
    useDashboardStore,
} from '../stores/dashboardStore';
import SettingsModal from './SettingsModal';

export default function DashboardSettingsModal() {
    const isSettingsOpen = useDashboardStore(selectIsSettingsOpen);
    const setSettingsOpen = useDashboardStore(selectSetSettingsOpen);

    return <SettingsModal open={isSettingsOpen} onOpenChange={setSettingsOpen} />;
}
